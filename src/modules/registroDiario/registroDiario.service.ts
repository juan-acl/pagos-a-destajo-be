import { Between, IsNull, LessThanOrEqual } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { RegistroDiarioRepository } from "../../repository/registroDiario.repository";
import { RegistrarDiasDtoType } from "./registroDiario.dto";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { DetalleEmpleadoDia } from "../../shared/paymentMethods";

export class RegistroDiarioService {
  private readonly repo = new RegistroDiarioRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly asignacionRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly asignacionEmpleadoRepo = new AsignacionEmpleadoRepository();
  private readonly miembroCuadrillaRepo = new MiembroCuadrillaRepository();

  private isPagoPorDias(modalidad?: string | null): boolean {
    const value = String(modalidad ?? "")
      .trim()
      .toUpperCase()
      .replace(/Á/g, "A");

    return ["PAGO_POR_DIA", "PAGO_POR_DIAS", "POR_DIA", "POR_DIAS"].includes(value);
  }

  async registrarDias(dto: RegistrarDiasDtoType) {
    const orden = await this.ordenRepo.findOne({ where: { id: dto.ordenId } });
    if (!orden) throw new NotFoundError(`Orden ${dto.ordenId} no encontrada`);
    if (!this.isPagoPorDias(orden.modalidad)) {
      throw new BadRequestError("La orden no es de modalidad PAGO_POR_DIAS");
    }

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { ordenTrabajoId: dto.ordenId },
    });
    if (!asignacionOrden) {
      throw new NotFoundError("La orden no tiene cuadrilla asignada");
    }

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: asignacionOrden.cuadrillaId } } as any,
    });
    if (asignaciones.length === 0) {
      throw new BadRequestError("No hay empleados asignados a la cuadrilla");
    }

    const montoDiario = Number(orden.pagoUnitario);
    const fechas = this.buildDateRange(dto.fechaInicio, dto.fechaFin);
    if (fechas.length === 0) {
      throw new BadRequestError("El rango de fechas no produce días válidos");
    }

    const today = this.toMidnight(new Date());
    const creados: number[] = [];

    for (const asig of asignaciones) {
      for (const fecha of fechas) {
        const existe = await this.repo.findOne({
          where: {
            asignacionEmpleadoId: asig.id,
            ordenTrabajoId: dto.ordenId,
            fecha,
          } as any,
        });
        if (existe) continue;

        const estado =
          fecha <= today ? "HABILITADO_PARA_PAGO" : "PROGRAMADO";

        const nuevo = this.repo.create({
          fecha,
          estado,
          montoDiario,
          asignacionEmpleadoId: asig.id,
          cuadrillaId: asignacionOrden.cuadrillaId,
          ordenTrabajoId: dto.ordenId,
          planillaId: null,
        });
        await this.repo.save(nuevo);
        creados.push(asig.id);
      }
    }

    return {
      diasCreados: creados.length,
      empleados: asignaciones.length,
      fechas: fechas.length,
    };
  }

  /** Transiciona PROGRAMADO → HABILITADO_PARA_PAGO para días cuya fecha ya llegó */
  async actualizarVigencia(ordenId?: number) {
    const today = this.toMidnight(new Date());

    const pendientes = await this.repo.findAll({
      where: {
        estado: "PROGRAMADO",
        ...(ordenId ? { ordenTrabajoId: ordenId } : {}),
      } as any,
    });

    let activados = 0;
    for (const r of pendientes) {
      if (this.toMidnight(r.fecha) <= today) {
        r.estado = "HABILITADO_PARA_PAGO";
        await this.repo.save(r);
        activados++;
      }
    }

    return { activados };
  }

  async getDiasHabilitados(
    ordenId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    return this.repo.findAll({
      where: {
        ordenTrabajoId: ordenId,
        estado: "HABILITADO_PARA_PAGO",
        planillaId: null,
        fecha: Between(
          this.toMidnight(fechaInicio),
          this.toEndOfDay(fechaFin),
        ),
      } as any,
    });
  }

  async calcularDetalleDias(
    ordenId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<{ detalle: DetalleEmpleadoDia[]; montoTotal: number; montoDiario: number }> {
    await this.actualizarVigencia(ordenId);

    const registros = await this.getDiasHabilitados(
      ordenId,
      fechaInicio,
      fechaFin,
    );

    if (registros.length === 0) {
      throw new BadRequestError(
        "No hay días habilitados para pago en el rango indicado",
      );
    }

    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundError(`Orden ${ordenId} no encontrada`);

    const montoDiario = Number(orden.pagoUnitario);
    const cuadrillaId = registros[0].cuadrillaId;

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { ordenTrabajoId: ordenId },
    });
    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(
      asignacionOrden?.cuadrillaId ?? cuadrillaId,
    );
    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    // Contar días por asignacionEmpleadoId
    const conteoPorAsig = new Map<number, number>();
    for (const r of registros) {
      conteoPorAsig.set(
        r.asignacionEmpleadoId,
        (conteoPorAsig.get(r.asignacionEmpleadoId) ?? 0) + 1,
      );
    }

    const isoInicio = fechaInicio.toISOString().split("T")[0];
    const isoFin = fechaFin.toISOString().split("T")[0];

    const detalle: DetalleEmpleadoDia[] = [];
    for (const [asigId, diasReconocidos] of conteoPorAsig) {
      const idx = asignaciones.findIndex((a) => a.id === asigId);
      const miembro = miembros[idx];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${asigId}`;

      detalle.push({
        empleadoId: miembro?.empleadoId ?? asigId,
        nombreEmpleado: nombre,
        montoDiario,
        fechaInicio: isoInicio,
        fechaFin: isoFin,
        diasReconocidos,
        montoIndividual: montoDiario * diasReconocidos,
        modalidad: "PAGO_POR_DIAS",
      });
    }

    const montoTotal = detalle.reduce((s, d) => s + d.montoIndividual, 0);
    return { detalle, montoTotal, montoDiario };
  }

  /** Marca los registros usados en la planilla como PAGADO */
  async marcarComoPagados(
    registroIds: number[],
    planillaId: number,
  ) {
    for (const id of registroIds) {
      await this.repo.update(id, { estado: "PAGADO", planillaId } as any);
    }
  }

  async getRegistroIdsDias(
    ordenId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<number[]> {
    const registros = await this.getDiasHabilitados(
      ordenId,
      fechaInicio,
      fechaFin,
    );
    return registros.map((r) => r.id);
  }

  async calcularDetallePorPlanilla(
    planillaId: number,
    ordenId: number,
  ): Promise<{ detalle: DetalleEmpleadoDia[]; montoTotal: number; montoDiario: number }> {
    const registros = await this.repo.findAll({
      where: { planillaId, ordenTrabajoId: ordenId } as any,
    });

    if (registros.length === 0) {
      throw new BadRequestError("No hay registros vinculados a esta planilla");
    }

    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundError(`Orden ${ordenId} no encontrada`);

    const montoDiario = Number(orden.pagoUnitario);
    const cuadrillaId = registros[0].cuadrillaId;

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { ordenTrabajoId: ordenId },
    });
    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(
      asignacionOrden?.cuadrillaId ?? cuadrillaId,
    );
    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    const times = registros.map((r) => new Date(r.fecha).getTime());
    const isoInicio = new Date(Math.min(...times)).toISOString().split("T")[0];
    const isoFin = new Date(Math.max(...times)).toISOString().split("T")[0];

    const conteoPorAsig = new Map<number, number>();
    for (const r of registros) {
      conteoPorAsig.set(
        r.asignacionEmpleadoId,
        (conteoPorAsig.get(r.asignacionEmpleadoId) ?? 0) + 1,
      );
    }

    const detalle: DetalleEmpleadoDia[] = [];
    for (const [asigId, diasReconocidos] of conteoPorAsig) {
      const idx = asignaciones.findIndex((a) => a.id === asigId);
      const miembro = miembros[idx];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${asigId}`;

      detalle.push({
        empleadoId: miembro?.empleadoId ?? asigId,
        nombreEmpleado: nombre,
        montoDiario,
        fechaInicio: isoInicio,
        fechaFin: isoFin,
        diasReconocidos,
        montoIndividual: montoDiario * diasReconocidos,
        modalidad: "PAGO_POR_DIAS",
      });
    }

    const montoTotal = detalle.reduce((s, d) => s + d.montoIndividual, 0);
    return { detalle, montoTotal, montoDiario };
  }

  async getByOrden(ordenId: number) {
    return this.repo.findAll({
      where: { ordenTrabajoId: ordenId } as any,
      order: { fecha: "ASC" } as any,
    });
  }

  private buildDateRange(inicio: string, fin: string): Date[] {
    const start = this.toMidnight(new Date(inicio));
    const end = this.toMidnight(new Date(fin));
    if (start > end) return [];

    const dates: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  private toMidnight(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  private toEndOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  }
}
