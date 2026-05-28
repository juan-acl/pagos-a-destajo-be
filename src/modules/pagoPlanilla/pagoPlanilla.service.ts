import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { LoteProduccion } from "../../entity/productionLot.entity";
import { Planilla } from "../../entity/pagoPlanilla.entity";
import { AsignacionEmpleado } from "../../entity/asignacionEmpleado.entity";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { EmployeeAssignmentRepository } from "../../repository/employeeAssignment.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { PlanillaRepository } from "../../repository/pagoPlanilla.repository";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  DetalleEmpleado,
  EvidenciaPagoType,
  Modalidad,
} from "../../shared/paymentMethods";
import { RegistroDiarioService } from "../registroDiario/registroDiario.service";

export class PaymentService {
  private readonly planillaRepo = new PlanillaRepository();
  private readonly loteRepo = new LoteProduccionRepository();
  private readonly revisionRepo = new RevisionProduccionRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly asignacionRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly asignacionEmpleadoRepo = new EmployeeAssignmentRepository();
  private readonly miembroCuadrillaRepo = new MiembroCuadrillaRepository();
  private readonly registroDiarioService = new RegistroDiarioService();

  private async withTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const result = await fn(qr.manager);
      await qr.commitTransaction();
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private buildCodigoPlanilla(id: number): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    return `PLA${yyyy}${mm}${dd}${id}`;
  }

  private normalizePagoEstado(estado?: string | null): string {
    return String(estado ?? "").trim().toUpperCase();
  }

  private isRevisionAprobada(estado?: string | null): boolean {
    return ["APROBADA", "APROBADO"].includes(this.normalizePagoEstado(estado));
  }

  private normalizeModalidad(modalidad?: string | null): Modalidad {
    const value = String(modalidad ?? "DESTAJO").trim().toUpperCase().replace(/Á/g, "A");
    if (["PAGO_POR_DIA", "PAGO_POR_DIAS", "POR_DIA", "POR_DIAS"].includes(value)) {
      return "PAGO_POR_DIAS";
    }
    return "DESTAJO";
  }

  private isPagoPorDias(modalidad?: string | null): boolean {
    return this.normalizeModalidad(modalidad) === "PAGO_POR_DIAS";
  }

  private normalizeOrdenEstado(estado?: string | null): string {
    return String(estado ?? "").trim().toUpperCase();
  }

  private isOrdenAptaParaPlanilla(estado?: string | null): boolean {
    return ["ACTIVO", "ACTIVA", "EN_PROCESO", "COMPLETADA", "COMPLETADO"].includes(
      this.normalizeOrdenEstado(estado),
    );
  }

  private getOrdenIdFromPlanilla(planilla: any): number | null {
    const id = Number(planilla?.ordenTrabajoId ?? 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private getLoteIdFromPlanilla(planilla: any): number | null {
    const id = Number(planilla?.loteProduccion?.id ?? 0);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private getAsignacionFromRevision(revision: any): AsignacionEmpleado | null {
    return (revision?.asignacionEmpleadoId as AsignacionEmpleado) ?? null;
  }

  private getAsignacionIdFromRevision(revision: any): number {
    const asignacion = this.getAsignacionFromRevision(revision) as any;
    return Number(asignacion?.id ?? revision?.asignacionEmpleadoId ?? 0);
  }

  private getCuadrillaIdFromRevision(revision: any): number | null {
    const asignacion = this.getAsignacionFromRevision(revision) as any;
    const cuadrilla = asignacion?.cuadrillaId;
    const cuadrillaId = Number(cuadrilla?.id ?? cuadrilla ?? 0);
    return Number.isFinite(cuadrillaId) && cuadrillaId > 0 ? cuadrillaId : null;
  }

  async getById(id: number) {
    const planilla = await this.planillaRepo.findOne({
      where: { id },
      relations: { loteProduccion: true },
    });
    if (!planilla) throw new NotFoundError("Planilla no encontrada");
    return planilla;
  }

  getAll(limit?: number) {
    return this.planillaRepo.findAll({
      relations: { loteProduccion: true },
      order: { fechaCreacion: "DESC" },
      ...(limit !== undefined ? { take: limit } : {}),
    });
  }

  getPendientes() {
    return this.planillaRepo.findAll({
      where: { estado: In(["PENDIENTE", "EN_REVISION"]) },
      relations: { loteProduccion: true },
      order: { fechaCreacion: "DESC" },
    });
  }

  async previewPlanilla(loteId: number) {
    const lote = await this.validarLoteParaPlanilla(loteId);
    return this.calcularDetalle(lote);
  }

  async previewPlanillaByOrden(ordenId: number, fechaInicio?: string, fechaFin?: string) {
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);
    if (!this.isOrdenAptaParaPlanilla(orden.estado)) {
      throw new BadRequestError(`La orden ${ordenId} no está en un estado apto para planilla`);
    }
    if (this.isPagoPorDias(orden.modalidad)) {
      this.validarFechasRequeridas(fechaInicio, fechaFin);
      return this.registroDiarioService.calcularDetalleDias(ordenId, new Date(fechaInicio!), new Date(fechaFin!));
    }
    return this.calcularDetallePorOrden(ordenId);
  }

  async generarPlanilla(loteId: number) {
    const lote = await this.validarLoteParaPlanilla(loteId);
    const { detalle, montoTotal } = await this.calcularDetalle(lote);
    if (detalle.length === 0) {
      throw new BadRequestError("No hay revisiones aprobadas para este lote");
    }
    const planilla = await this.withTransaction(async (manager) => {
      const nueva = manager.create(Planilla, {
        loteProduccion: { id: loteId } as LoteProduccion,
        numeroPago: loteId,
        montoTotal,
        metodoPago: "EFECTIVO",
        descripcion: `Planilla generada para lote ${lote.numeroLote}`,
        estado: "PENDIENTE",
        modalidad: "DESTAJO",
        fechaPago: new Date(),
      });
      const saved = await manager.save(Planilla, nueva);
      saved.codigoPlanilla = this.buildCodigoPlanilla(saved.id);
      return manager.save(Planilla, saved);
    });
    return { planilla, detalle, montoTotal };
  }

  async generarPlanillaByOrden(ordenId: number, fechaInicio?: string, fechaFin?: string) {
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);
    if (!this.isOrdenAptaParaPlanilla(orden.estado)) {
      throw new BadRequestError(`La orden ${ordenId} no está en un estado apto para planilla`);
    }

    if (this.isPagoPorDias(orden.modalidad)) {
      this.validarFechasRequeridas(fechaInicio, fechaFin);
      const fi = new Date(fechaInicio!);
      const ff = new Date(fechaFin!);
      const { detalle, montoTotal, montoDiario } = await this.registroDiarioService.calcularDetalleDias(ordenId, fi, ff);
      if (detalle.length === 0 || montoTotal <= 0) {
        throw new BadRequestError("No hay días habilitados para pago en el rango indicado");
      }
      const registroIds = await this.registroDiarioService.getRegistroIdsDias(ordenId, fi, ff);
      const planilla = await this.withTransaction(async (manager) => {
        const nueva = manager.create(Planilla, {
          loteProduccion: null,
          ordenTrabajoId: ordenId,
          numeroPago: ordenId,
          montoTotal,
          metodoPago: "EFECTIVO",
          descripcion: `Planilla PAGO_POR_DIAS — Orden ${ordenId} | ${fechaInicio} al ${fechaFin} | Tarifa/día: Q${montoDiario}`,
          estado: "PENDIENTE",
          modalidad: "PAGO_POR_DIAS",
          fechaInicioPago: fi,
          fechaFinPago: ff,
          fechaPago: new Date(),
        });
        const saved = await manager.save(Planilla, nueva);
        saved.codigoPlanilla = this.buildCodigoPlanilla(saved.id);
        return manager.save(Planilla, saved);
      });
      await this.registroDiarioService.marcarComoPagados(registroIds, planilla.id);
      return { planilla, detalle, montoTotal };
    }

    const { detalle, montoTotal } = await this.calcularDetallePorOrden(ordenId);
    if (detalle.length === 0 || montoTotal <= 0) {
      throw new BadRequestError("La orden no tiene revisiones aprobadas con monto pagable");
    }
    const lote = await this.getLoteByOrden(ordenId);
    const planilla = await this.withTransaction(async (manager) => {
      const nueva = manager.create(Planilla, {
        loteProduccion: { id: lote.id } as LoteProduccion,
        numeroPago: lote.id,
        montoTotal,
        metodoPago: "EFECTIVO",
        descripcion: `Planilla DESTAJO generada para orden ${ordenId}`,
        estado: "PENDIENTE",
        modalidad: "DESTAJO",
        fechaPago: new Date(),
      });
      const saved = await manager.save(Planilla, nueva);
      saved.codigoPlanilla = this.buildCodigoPlanilla(saved.id);
      return manager.save(Planilla, saved);
    });
    return { planilla, detalle, montoTotal };
  }

  async ejecutarPago(planillaId: number, evidencia: EvidenciaPagoType) {
    const planilla = await this.getById(planillaId);
    if (!["PENDIENTE", "EN_REVISION"].includes(planilla.estado)) {
      throw new BadRequestError(`La planilla está en estado ${planilla.estado} y no puede ser procesada`);
    }
    if (evidencia.montoConfirmado !== planilla.montoTotal) {
      throw new BadRequestError(`El monto confirmado (${evidencia.montoConfirmado}) no coincide con el monto total de la planilla (${planilla.montoTotal})`);
    }
    this.validarEvidencia(evidencia);
    if (planilla.modalidad === "PAGO_POR_DIAS") {
      return this.ejecutarPagoDias(planilla, evidencia);
    }
    return this.ejecutarPagoDestajo(planillaId, planilla, evidencia);
  }

  private async ejecutarPagoDias(planilla: Planilla, evidencia: EvidenciaPagoType) {
    return this.withTransaction(async (manager) => {
      planilla.estado = "PAGO_REALIZADO" as any;
      planilla.metodoPago = evidencia.metodoPago;
      planilla.descripcion = this.buildDescripcionEvidencia(evidencia);
      planilla.fechaPago = new Date();
      planilla.fechaActualizacion = new Date();
      return manager.save(Planilla, planilla);
    });
  }

  private async ejecutarPagoDestajo(planillaId: number, planilla: Planilla, evidencia: EvidenciaPagoType) {
    const asignaciones = await this.obtenerAsignacionesDePlanilla(planillaId);
    return this.withTransaction(async (manager) => {
      planilla.estado = "PAGADO" as any;
      planilla.metodoPago = evidencia.metodoPago;
      planilla.descripcion = this.buildDescripcionEvidencia(evidencia);
      planilla.fechaPago = new Date();
      planilla.fechaActualizacion = new Date();
      await manager.save(Planilla, planilla);
      for (const asig of asignaciones) {
        asig.estado = "INACTIVA";
        await manager.save(AsignacionEmpleado, asig);
      }
      return planilla;
    });
  }

  async rechazarPlanilla(planillaId: number, observaciones: string) {
    if (!observaciones || observaciones.trim().length === 0) {
      throw new BadRequestError("Las observaciones son obligatorias al rechazar");
    }
    const planilla = await this.getById(planillaId);
    if (!["PENDIENTE", "EN_REVISION"].includes(planilla.estado)) {
      throw new BadRequestError(`La planilla en estado ${planilla.estado} no puede ser rechazada`);
    }
    planilla.estado = "RECHAZADO";
    planilla.descripcion = `RECHAZADO: ${observaciones}`;
    planilla.fechaActualizacion = new Date();
    return this.planillaRepo.save(planilla);
  }

  async getDetallePlanilla(planillaId: number) {
    const planilla = await this.getById(planillaId);
    if (planilla.modalidad === "PAGO_POR_DIAS") {
      return this.getDetallePlanillaDias(planilla);
    }
    return this.getDetallePlanillaDestajo(planilla);
  }

  private async getDetallePlanillaDestajo(planilla: Planilla) {
    const lote = planilla.loteProduccion as LoteProduccion;
    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id },
      relations: { revisionProduccionId: true },
    });
    const revision = loteConRevision?.revisionProduccionId;
    if (!revision) throw new NotFoundError("El lote no tiene revisión de producción asociada");

    const revConAsig = await this.revisionRepo.findOne({
      where: { id: revision.id },
      relations: { asignacionEmpleadoId: { cuadrillaId: true } } as any,
    });
    const cuadrillaId = this.getCuadrillaIdFromRevision(revConAsig);
    if (!cuadrillaId) throw new NotFoundError("La revisión no tiene asignación de empleado");

    const asignacionOrden = await this.asignacionRepo.findOne({ where: { cuadrillaId } });
    const orden = asignacionOrden ? await this.ordenRepo.findOne({ where: { id: asignacionOrden.ordenTrabajoId } }) : null;
    const pagoUnitario = Number(orden?.pagoUnitario ?? 0);
    const modalidad: Modalidad = this.normalizeModalidad(orden?.modalidad);

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({ where: { cuadrillaId: { id: cuadrillaId } } as any });
    const asignacionIds = asignaciones.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: { estadoRevision: In(["APROBADA", "APROBADO"]) as any, asignacionEmpleadoId: In(asignacionIds) as any } as any,
      relations: { estadoRevisionId: true },
    });
    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp ? `${emp.primerNombre} ${emp.primerApellido}` : `Empleado-${asig.id}`;
      const rev = revisiones.find((r) => this.getAsignacionIdFromRevision(r) === Number(asig.id));
      const cantidadAprobada = rev?.cantidadAprobada ?? 0;
      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
        modalidad,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { planilla, lote, detalle, montoTotal, pagoUnitario, modalidad };
  }

  private async getDetallePlanillaDias(planilla: Planilla) {
    if (!planilla.ordenTrabajoId) {
      throw new BadRequestError("La planilla PAGO_POR_DIAS no tiene orden de trabajo asociada");
    }
    const { detalle, montoTotal, montoDiario } = await this.registroDiarioService.calcularDetallePorPlanilla(planilla.id, planilla.ordenTrabajoId);
    return { planilla, lote: null, detalle, montoTotal, pagoUnitario: montoDiario, modalidad: "PAGO_POR_DIAS" as Modalidad };
  }

  async getOrdenesDisponibles() {
    const todas = await this.ordenRepo.findAll({ order: { fechaCreacion: "DESC" } as any });
    const ordenes = (todas as any[]).filter((orden) => this.isOrdenAptaParaPlanilla(orden.estado));
    if (ordenes.length === 0) return [];

    const planillas = await this.planillaRepo.findAll({ relations: { loteProduccion: true } });
    const ordenIdsDestajoConPlanilla = new Set<number>();

    for (const p of planillas as any[]) {
      if (this.isPagoPorDias(p.modalidad)) continue;
      const ordenTrabajoId = this.getOrdenIdFromPlanilla(p);
      if (ordenTrabajoId) ordenIdsDestajoConPlanilla.add(ordenTrabajoId);
    }

    const loteIdsConPlanillaDestajo = (planillas as any[])
      .filter((p) => !this.isPagoPorDias(p.modalidad))
      .map((p) => this.getLoteIdFromPlanilla(p))
      .filter((id): id is number => Boolean(id));

    if (loteIdsConPlanillaDestajo.length > 0) {
      try {
        const lotes = await this.loteRepo.findAll({
          where: { id: In(loteIdsConPlanillaDestajo) } as any,
          relations: { revisionProduccionId: { asignacionEmpleadoId: { cuadrillaId: true } } } as any,
        });
        const cuadrillaIds = [...new Set(
          (lotes as any[]).map((l) => this.getCuadrillaIdFromRevision(l.revisionProduccionId))
            .filter((id): id is number => Number.isFinite(Number(id)) && Number(id) > 0),
        )];
        if (cuadrillaIds.length > 0) {
          const asignacionesOrden = await this.asignacionRepo.findAll({ where: { cuadrillaId: In(cuadrillaIds) as any } as any });
          for (const a of asignacionesOrden as any[]) {
            if (a.ordenTrabajoId) ordenIdsDestajoConPlanilla.add(Number(a.ordenTrabajoId));
          }
        }
      } catch (error) {
        console.error("No se pudieron resolver órdenes con planilla desde lotes; se continuará con las órdenes directas.", error);
      }
    }

    return ordenes.filter((orden: any) => {
      const modalidad = this.normalizeModalidad(orden.modalidad);
      if (modalidad === "PAGO_POR_DIAS") return true;
      return !ordenIdsDestajoConPlanilla.has(Number(orden.id));
    });
  }

  async getPagoEmpleado(planillaId: number, empleadoId: number) {
    const planilla = await this.getById(planillaId);
    if (planilla.modalidad === "PAGO_POR_DIAS") {
      const resultado = await this.getDetallePlanillaDias(planilla);
      const miDetalle = resultado.detalle.find((d) => d.empleadoId === empleadoId);
      if (!miDetalle) throw new NotFoundError("No tienes pago asociado a esta planilla");
      return {
        estado: planilla.estado,
        metodoPago: planilla.metodoPago,
        modalidad: "PAGO_POR_DIAS",
        montoDiario: (miDetalle as any).montoDiario,
        diasReconocidos: (miDetalle as any).diasReconocidos,
        montoIndividual: (miDetalle as any).montoIndividual,
        fechaInicio: (miDetalle as any).fechaInicio,
        fechaFin: (miDetalle as any).fechaFin,
      };
    }

    const loteId = (planilla.loteProduccion as LoteProduccion).id;
    const lote = await this.loteRepo.findOne({ where: { id: loteId } });
    if (!lote) throw new NotFoundError("Lote no encontrado");

    const { detalle } = await this.calcularDetalle(lote);
    const miDetalle = detalle.find((d) => d.empleadoId === empleadoId);
    if (!miDetalle) throw new NotFoundError("No tienes pago asociado a esta planilla");

    return {
      estado: planilla.estado,
      metodoPago: planilla.metodoPago,
      montoRealizado: miDetalle.montoRealizado,
      cantidadAprobada: miDetalle.cantidadAprobada,
      metaIndividual: miDetalle.metaIndividual,
      pagoUnitario: miDetalle.pagoUnitario,
      modalidad: miDetalle.modalidad,
    };
  }

  private validarFechasRequeridas(fechaInicio?: string, fechaFin?: string): void {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestError("Para PAGO_POR_DIAS se requieren fechaInicio y fechaFin (YYYY-MM-DD)");
    }
  }

  private async obtenerAsignacionesDePlanilla(planillaId: number): Promise<AsignacionEmpleado[]> {
    const planilla = await this.planillaRepo.findOne({ where: { id: planillaId }, relations: { loteProduccion: true } });
    if (!planilla) throw new NotFoundError("Planilla no encontrada");
    if (planilla.modalidad === "PAGO_POR_DIAS") return [];

    const lote = planilla.loteProduccion as LoteProduccion | null;
    if (!lote) throw new NotFoundError("La planilla no tiene lote asociado");

    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id },
      relations: { revisionProduccionId: { asignacionEmpleadoId: { cuadrillaId: true } } } as any,
    });
    const revision = loteConRevision?.revisionProduccionId;
    const cuadrillaId = this.getCuadrillaIdFromRevision(revision);
    if (!cuadrillaId) throw new NotFoundError("No se encontró la cuadrilla de la revisión");

    return this.asignacionEmpleadoRepo.findAll({ where: { cuadrillaId: { id: cuadrillaId } } as any });
  }

  private async validarLoteParaPlanilla(loteId: number) {
    const lote = await this.loteRepo.findOne({ where: { id: loteId } });
    if (!lote) throw new NotFoundError("Lote de producción no encontrado");
    if (lote.estado !== "APROBADO") {
      throw new BadRequestError(`El lote está en estado ${lote.estado}. Solo se puede generar planilla para lotes APROBADOS`);
    }
    const planillaExistente = await this.planillaRepo.findOne({ where: { loteProduccion: { id: loteId } } });
    if (planillaExistente) {
      throw new BadRequestError(`Ya existe una planilla (${planillaExistente.numeroPago}) para este lote`);
    }
    return lote;
  }

  private async calcularDetalle(lote: LoteProduccion) {
    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id } as any,
      relations: { revisionProduccionId: { asignacionEmpleadoId: { cuadrillaId: true } } } as any,
    });
    const revisionBase = loteConRevision?.revisionProduccionId;
    if (!revisionBase) throw new NotFoundError("El lote no tiene revisión asociada");

    const cuadrillaId = this.getCuadrillaIdFromRevision(revisionBase);
    if (!cuadrillaId) throw new NotFoundError("No se pudo determinar la cuadrilla del lote para calcular la planilla");

    const asignacionOrden = await this.asignacionRepo.findOne({ where: { cuadrillaId } });
    const ordenTrabajo = asignacionOrden ? await this.ordenRepo.findOne({ where: { id: asignacionOrden.ordenTrabajoId } }) : null;
    const pagoUnitario = Number(ordenTrabajo?.pagoUnitario ?? 0);
    const modalidad: Modalidad = this.normalizeModalidad(ordenTrabajo?.modalidad);

    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);
    const asignaciones = await this.asignacionEmpleadoRepo.findAll({ where: { cuadrillaId: { id: cuadrillaId } } as any });
    const asignacionIds = asignaciones.map((a) => a.id);
    const revisiones = asignacionIds.length > 0
      ? await this.revisionRepo.findAll({
          where: { estadoRevision: In(["APROBADA", "APROBADO"]) as any, asignacionEmpleadoId: In(asignacionIds) as any } as any,
          relations: { asignacionEmpleadoId: true },
        })
      : [];

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp ? `${emp.primerNombre} ${emp.primerApellido}` : `Empleado-${asig.id}`;
      const rev = (revisiones as any[]).find((r) => this.getAsignacionIdFromRevision(r) === Number(asig.id));
      const cantidadAprobada = Number(rev?.cantidadAprobada ?? 0);
      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
        modalidad,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { detalle, montoTotal, pagoUnitario, modalidad };
  }

  private async calcularDetallePorOrden(ordenId: number) {
    const asignacionOrden = await this.asignacionRepo.findOne({ where: { ordenTrabajoId: ordenId } });
    if (!asignacionOrden) throw new NotFoundError(`No existe asignación de cuadrilla para la orden ${ordenId}`);

    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);

    const { cuadrillaId } = asignacionOrden;
    const pagoUnitario = Number(orden.pagoUnitario ?? 0);
    const modalidad: Modalidad = this.normalizeModalidad(orden.modalidad);

    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);
    const asignaciones = await this.asignacionEmpleadoRepo.findAll({ where: { cuadrillaId: { id: cuadrillaId } } as any });
    if (asignaciones.length === 0) throw new BadRequestError(`No hay asignaciones de empleados para la cuadrilla ${cuadrillaId}`);

    const asignacionIds = asignaciones.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: { estadoRevision: In(["APROBADA", "APROBADO"]) as any, asignacionEmpleadoId: In(asignacionIds) as any } as any,
      relations: { asignacionEmpleadoId: true },
    });

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp ? `${emp.primerNombre} ${emp.primerApellido}` : `Empleado-${asig.id}`;
      const rev = (revisiones as any[]).find((r) => this.getAsignacionIdFromRevision(r) === Number(asig.id));
      const cantidadAprobada = Number(rev?.cantidadAprobada ?? 0);
      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
        modalidad,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { detalle, montoTotal, pagoUnitario, modalidad };
  }

  private async getLoteByOrden(ordenId: number): Promise<LoteProduccion> {
    const asignacionOrden = await this.asignacionRepo.findOne({ where: { ordenTrabajoId: ordenId } });
    if (!asignacionOrden) throw new NotFoundError(`No existe asignación de cuadrilla para la orden ${ordenId}`);

    const asignacionesEmpleado = await this.asignacionEmpleadoRepo.findAll({ where: { cuadrillaId: { id: asignacionOrden.cuadrillaId } } as any });
    if (asignacionesEmpleado.length === 0) throw new NotFoundError(`No existen asignaciones de empleados para la cuadrilla ${asignacionOrden.cuadrillaId}`);

    const asignacionIds = asignacionesEmpleado.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: { estadoRevision: In(["APROBADA", "APROBADO"]) as any, asignacionEmpleadoId: In(asignacionIds) as any } as any,
      relations: { asignacionEmpleadoId: true },
    });
    if (revisiones.length === 0) throw new NotFoundError(`No existen revisiones aprobadas para la orden ${ordenId}`);

    const revisionIds = revisiones.map((r) => r.id);
    const lotes = await this.loteRepo.findAll({
      where: { revisionProduccionId: { id: In(revisionIds) as any } } as any,
      relations: { revisionProduccionId: true } as any,
    });
    if (lotes.length === 0) throw new NotFoundError(`No existe lote vinculado a revisiones aprobadas para la orden ${ordenId}`);

    return lotes.find((l) => ["APROBADO", "APROBADA"].includes(this.normalizePagoEstado(l.estado))) ?? lotes[0];
  }

  private async getAsignacionesActualesDeCuadrilla(cuadrillaId: number) {
    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);
    const miembrosActivos = miembros.filter((m: any) => String(m.estado ?? "ACTIVO").toUpperCase() === "ACTIVO");
    if (miembrosActivos.length === 0) throw new BadRequestError(`La cuadrilla ${cuadrillaId} no tiene miembros activos`);

    const asignacionesHistoricas = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId }, estado: "ACTIVO" } as any,
      order: { id: "DESC" } as any,
    });
    if (asignacionesHistoricas.length === 0) throw new BadRequestError(`No hay asignaciones activas para la cuadrilla ${cuadrillaId}`);

    const asignacionesActuales = asignacionesHistoricas.slice(0, miembrosActivos.length).reverse();
    return { miembrosActivos, asignacionesActuales };
  }

  private validarEvidencia(evidencia: EvidenciaPagoType) {
    switch (evidencia.metodoPago) {
      case "TRANSFERENCIA":
        if (!evidencia.bancoDestino || !evidencia.numeroCuenta || !evidencia.numeroTransferencia) {
          throw new BadRequestError("Para transferencia se requiere: bancoDestino, numeroCuenta, numeroTransferencia");
        }
        break;
      case "CHEQUE":
        if (!evidencia.numeroCheque || !evidencia.bancoEmisor || !evidencia.fechaCheque) {
          throw new BadRequestError("Para cheque se requiere: numeroCheque, bancoEmisor, fechaCheque");
        }
        break;
      case "EFECTIVO":
        if (!evidencia.responsableEntrega || !evidencia.fechaEntrega) {
          throw new BadRequestError("Para efectivo se requiere: responsableEntrega, fechaEntrega");
        }
        break;
      default:
        throw new BadRequestError("Método de pago no válido");
    }
  }

  private buildDescripcionEvidencia(evidencia: EvidenciaPagoType) {
    const partes = [`Pago ejecutado por ${evidencia.metodoPago}`];
    if (evidencia.usuarioPagoNombre) {
      partes.push(`Usuario: ${evidencia.usuarioPagoNombre}${evidencia.usuarioPagoId ? ` (ID ${evidencia.usuarioPagoId})` : ""}`);
    }
    if (evidencia.metodoPago === "EFECTIVO" && evidencia.responsableEntrega) {
      partes.push(`Responsable entrega: ${evidencia.responsableEntrega}`);
    }
    if (evidencia.numeroTransferencia) partes.push(`Transferencia: ${evidencia.numeroTransferencia}`);
    if (evidencia.bancoDestino) partes.push(`Banco: ${evidencia.bancoDestino}`);
    if (evidencia.referenciaDeposito) partes.push(`Referencia depósito: ${evidencia.referenciaDeposito}`);
    if (evidencia.numeroCheque) partes.push(`Cheque: ${evidencia.numeroCheque}`);
    if (evidencia.nombreBeneficiario) partes.push(`Beneficiario: ${evidencia.nombreBeneficiario}`);
    if (evidencia.observaciones) partes.push(`Obs: ${evidencia.observaciones}`);
    return partes.join(" | ");
  }
}