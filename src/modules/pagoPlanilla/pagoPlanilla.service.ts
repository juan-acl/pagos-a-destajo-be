import { In } from "typeorm";
import { LoteProduccion } from "../../entity/productionLot.entity";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { PlanillaRepository } from "../../repository/pagoPlanilla.repository";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  DetalleEmpleado,
  EvidenciaPagoType,
} from "../../shared/paymentMethods";

export class PaymentService {
  private readonly planillaRepo = new PlanillaRepository();
  private readonly loteRepo = new LoteProduccionRepository();
  private readonly revisionRepo = new RevisionProduccionRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly asignacionRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly asignacionEmpleadoRepo = new AsignacionEmpleadoRepository();
  private readonly miembroCuadrillaRepo = new MiembroCuadrillaRepository();

  async getById(id: number) {
    const planilla = await this.planillaRepo.findOne({
      where: { id },
      relations: { loteProduccion: true },
    });
    if (!planilla) throw new NotFoundError("Planilla no encontrada");
    return planilla;
  }

  getAll() {
    return this.planillaRepo.findAll({
      relations: { loteProduccion: true },
      order: { fechaCreacion: "DESC" },
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

  async generarPlanilla(loteId: number) {
    const lote = await this.validarLoteParaPlanilla(loteId);

    const { detalle, montoTotal } = await this.calcularDetalle(lote);

    if (detalle.length === 0) {
      throw new BadRequestError("No hay revisiones aprobadas para este lote");
    }

    const now = new Date();
    const numeroPlanilla = loteId;

    const planilla = this.planillaRepo.create({
      loteProduccion: { id: loteId } as LoteProduccion,
      numeroPago: numeroPlanilla,
      montoTotal,
      metodoPago: "EFECTIVO",
      descripcion: `Planilla generada para lote ${lote.numeroLote}`,
      estado: "PENDIENTE",
      fechaPago: now,
    });

    const saved = await this.planillaRepo.save(planilla);

    return {
      planilla: saved,
      detalle,
      montoTotal,
    };
  }

  async ejecutarPago(planillaId: number, evidencia: EvidenciaPagoType) {
    const planilla = await this.getById(planillaId);

    if (!["PENDIENTE", "EN_REVISION"].includes(planilla.estado)) {
      throw new BadRequestError(
        `La planilla está en estado ${planilla.estado} y no puede ser procesada`,
      );
    }

    if (evidencia.montoConfirmado !== planilla.montoTotal) {
      throw new BadRequestError(
        `El monto confirmado (${evidencia.montoConfirmado}) no coincide con el monto total de la planilla (${planilla.montoTotal})`,
      );
    }

    this.validarEvidencia(evidencia);

    planilla.estado = "EN_REVISION";
    planilla.fechaActualizacion = new Date();
    await this.planillaRepo.save(planilla);

    planilla.estado = "PROCESANDO";
    planilla.fechaActualizacion = new Date();
    await this.planillaRepo.save(planilla);

    planilla.estado = "PAGADO";
    planilla.metodoPago = evidencia.metodoPago;
    planilla.descripcion = this.buildDescripcionEvidencia(evidencia);
    planilla.fechaPago = new Date();
    planilla.fechaActualizacion = new Date();
    await this.planillaRepo.save(planilla);

    return planilla;
  }

  async rechazarPlanilla(planillaId: number, observaciones: string) {
    if (!observaciones || observaciones.trim().length === 0) {
      throw new BadRequestError(
        "Las observaciones son obligatorias al rechazar",
      );
    }

    const planilla = await this.getById(planillaId);

    if (!["PENDIENTE", "EN_REVISION"].includes(planilla.estado)) {
      throw new BadRequestError(
        `La planilla en estado ${planilla.estado} no puede ser rechazada`,
      );
    }

    planilla.estado = "RECHAZADO";
    planilla.descripcion = `RECHAZADO: ${observaciones}`;
    planilla.fechaActualizacion = new Date();

    return this.planillaRepo.save(planilla);
  }

  async getPagoEmpleado(planillaId: number, empleadoId: number) {
    const planilla = await this.getById(planillaId);

    const loteId = (planilla.loteProduccion as LoteProduccion).id;
    const lote = await this.loteRepo.findOne({
      where: { id: loteId },
    });

    if (!lote) throw new NotFoundError("Lote no encontrado");

    const { detalle } = await this.calcularDetalle(lote);
    const miDetalle = detalle.find((d) => d.empleadoId === empleadoId);

    if (!miDetalle) {
      throw new NotFoundError("No tienes pago asociado a esta planilla");
    }

    return {
      estado: planilla.estado,
      metodoPago: planilla.metodoPago,
      montoRealizado: miDetalle.montoRealizado,
      cantidadAprobada: miDetalle.cantidadAprobada,
      metaIndividual: miDetalle.metaIndividual,
      pagoUnitario: miDetalle.pagoUnitario,
    };
  }

  async previewPlanillaByOrden(ordenId: number) {
    return this.calcularDetallePorOrden(ordenId);
  }

  async generarPlanillaByOrden(ordenId: number) {
    const { detalle, montoTotal } = await this.calcularDetallePorOrden(ordenId);

    if (detalle.length === 0) {
      throw new BadRequestError(
        "No hay asignaciones de empleados para esta orden",
      );
    }

    const lote = await this.getLoteByOrden(ordenId);

    const planilla = this.planillaRepo.create({
      loteProduccion: { id: lote.id } as LoteProduccion,
      numeroPago: lote.id,
      montoTotal,
      metodoPago: "EFECTIVO",
      descripcion: `Planilla generada para orden ${ordenId}`,
      estado: "PENDIENTE",
      fechaPago: new Date(),
    });

    const saved = await this.planillaRepo.save(planilla);
    return { planilla: saved, detalle, montoTotal };
  }

  async getDetallePlanilla(planillaId: number) {
    const planilla = await this.getById(planillaId);
    const lote = planilla.loteProduccion as LoteProduccion;

    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id },
      relations: { revisionProduccionId: true },
    });
    const revision = loteConRevision?.revisionProduccionId;
    if (!revision) {
      throw new NotFoundError(
        "El lote no tiene revisión de producción asociada",
      );
    }

    const revConAsig = await this.revisionRepo.findOne({
      where: { id: revision.id },
      relations: { asignacionEmpleadoId: { cuadrillaId: true } },
    });
    const asignacionBase = revConAsig?.asignacionEmpleadoId;
    if (!asignacionBase) {
      throw new NotFoundError("La revisión no tiene asignación de empleado");
    }
    const cuadrillaId = (asignacionBase.cuadrillaId as any)?.id as number;

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { cuadrillaId },
    });
    const orden = asignacionOrden
      ? await this.ordenRepo.findOne({
          where: { id: asignacionOrden.ordenTrabajoId },
        })
      : null;
    const pagoUnitario = Number(orden?.pagoUnitario ?? 0);

    const { miembrosActivos, asignacionesActuales } =
      await this.getAsignacionesActualesDeCuadrilla(cuadrillaId);

    const asignacionIds = asignacionesActuales.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
        asignacionEmpleadoId: In(asignacionIds) as any,
      },
      relations: { asignacionEmpleadoId: true },
    });

    const detalle: DetalleEmpleado[] = asignacionesActuales.map((asig, i) => {
      const miembro = miembrosActivos[i];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${miembro?.empleadoId ?? asig.id}`;

      const rev = revisiones.find(
        (r) => (r.asignacionEmpleadoId as any)?.id === asig.id,
      );
      const cantidadAprobada = Number(rev?.cantidadAprobada ?? 0);

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { planilla, lote, detalle, montoTotal, pagoUnitario };
  }

  async getOrdenesDisponibles() {
    const ordenes = await this.ordenRepo.findAll({
      where: { estado: "activo" },
      order: { fechaCreacion: "DESC" } as any,
    });
    if (ordenes.length === 0) return [];

    const planillas = await this.planillaRepo.findAll({
      relations: { loteProduccion: true },
    });
    if (planillas.length === 0) return ordenes;

    const loteIdsConPlanilla = planillas
      .map((p) => (p.loteProduccion as LoteProduccion)?.id)
      .filter(Boolean) as number[];

    const lotes = await this.loteRepo.findAll({
      where: { id: In(loteIdsConPlanilla) },
      relations: { revisionProduccionId: true },
    });

    const revisionIds = lotes
      .map((l) => (l.revisionProduccionId as any)?.id)
      .filter(Boolean) as number[];
    if (revisionIds.length === 0) return ordenes;

    const revisiones = await this.revisionRepo.findAll({
      where: { id: In(revisionIds) },
      relations: { asignacionEmpleadoId: { cuadrillaId: true } },
    });

    const cuadrillaIds = [
      ...new Set(
        revisiones
          .map(
            (r) => (r.asignacionEmpleadoId?.cuadrillaId as any)?.id as number,
          )
          .filter(Boolean),
      ),
    ];
    if (cuadrillaIds.length === 0) return ordenes;

    const asignacionesOrden = await this.asignacionRepo.findAll({
      where: { cuadrillaId: In(cuadrillaIds) } as any,
    });

    const ordenIdsConPlanilla = new Set(
      asignacionesOrden.map((a) => a.ordenTrabajoId),
    );

    return ordenes.filter((o) => !ordenIdsConPlanilla.has(o.id));
  }

  private async calcularDetallePorOrden(ordenId: number) {
    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { ordenTrabajoId: ordenId },
    });
    if (!asignacionOrden) {
      throw new NotFoundError(
        `No existe asignación de cuadrilla para la orden ${ordenId}`,
      );
    }

    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });
    if (!orden) {
      throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);
    }

    const { cuadrillaId } = asignacionOrden;
    const pagoUnitario = Number(orden.pagoUnitario ?? 0);

    const { miembrosActivos, asignacionesActuales } =
      await this.getAsignacionesActualesDeCuadrilla(cuadrillaId);

    const asignacionIds = asignacionesActuales.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
        asignacionEmpleadoId: In(asignacionIds) as any,
      },
      relations: { asignacionEmpleadoId: true },
    });

    const detalle: DetalleEmpleado[] = asignacionesActuales.map((asig, i) => {
      const miembro = miembrosActivos[i];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${miembro?.empleadoId ?? asig.id}`;

      const rev = revisiones.find(
        (r) => (r.asignacionEmpleadoId as any)?.id === asig.id,
      );
      const cantidadAprobada = Number(rev?.cantidadAprobada ?? 0);

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { detalle, montoTotal, pagoUnitario };
  }

  private async getLoteByOrden(ordenId: number): Promise<LoteProduccion> {
    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { ordenTrabajoId: ordenId },
    });
    if (!asignacionOrden) {
      throw new NotFoundError(
        `No existe asignación de cuadrilla para la orden ${ordenId}`,
      );
    }

    const asignacionEmpleado = await this.asignacionEmpleadoRepo.findOne({
      where: { cuadrillaId: { id: asignacionOrden.cuadrillaId } } as any,
    });
    if (!asignacionEmpleado) {
      throw new NotFoundError(
        `No existe asignación de empleado para la cuadrilla ${asignacionOrden.cuadrillaId}`,
      );
    }

    const revision = await this.revisionRepo.findOne({
      where: { asignacionEmpleadoId: { id: asignacionEmpleado.id } } as any,
    });

    if (!revision) {
      throw new NotFoundError(
        `No existe revisión de producción para la asignación ${asignacionEmpleado.id}`,
      );
    }

    const lote = await this.loteRepo.findOne({
      where: { revisionProduccionId: { id: revision.id } } as any,
    });

    if (!lote) {
      throw new NotFoundError(
        `No existe lote de producción vinculado a la revisión ${revision.id}`,
      );
    }

    return lote;
  }

  private async validarLoteParaPlanilla(loteId: number) {
    const lote = await this.loteRepo.findOne({
      where: { id: loteId },
    });

    if (!lote) throw new NotFoundError("Lote de producción no encontrado");

    if (lote.estado !== "APROBADO") {
      throw new BadRequestError(
        `El lote está en estado ${lote.estado}. Solo se puede generar planilla para lotes APROBADOS`,
      );
    }

    const planillaExistente = await this.planillaRepo.findOne({
      where: { loteProduccion: { id: loteId } },
    });

    if (planillaExistente) {
      throw new BadRequestError(
        `Ya existe una planilla (${planillaExistente.numeroPago}) para este lote`,
      );
    }

    return lote;
  }

  private async calcularDetalle(lote: LoteProduccion) {
    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id },
      relations: {
        revisionProduccionId: {
          asignacionEmpleadoId: {
            cuadrillaId: true,
          },
        },
      } as any,
    });

    const revisionBase = loteConRevision?.revisionProduccionId as any;
    const cuadrillaId = revisionBase?.asignacionEmpleadoId?.cuadrillaId?.id;

    if (!cuadrillaId) {
      throw new NotFoundError("No se pudo determinar la cuadrilla del lote");
    }

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { cuadrillaId },
    });

    const ordenTrabajo = asignacionOrden
      ? await this.ordenRepo.findOne({
          where: { id: asignacionOrden.ordenTrabajoId },
        })
      : null;

    const pagoUnitario = Number(ordenTrabajo?.pagoUnitario ?? 0);

    const { miembrosActivos, asignacionesActuales } =
      await this.getAsignacionesActualesDeCuadrilla(cuadrillaId);

    const asignacionIds = asignacionesActuales.map((a) => a.id);

    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
        asignacionEmpleadoId: In(asignacionIds) as any,
      },
      relations: {
        asignacionEmpleadoId: true,
      },
    });

    const detalle: DetalleEmpleado[] = asignacionesActuales.map((asig, i) => {
      const miembro = miembrosActivos[i];
      const emp = miembro?.empleado;

      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${miembro?.empleadoId ?? asig.id}`;

      const rev = revisiones.find(
        (r) => (r.asignacionEmpleadoId as any)?.id === asig.id,
      );

      const cantidadAprobada = Number(rev?.cantidadAprobada ?? 0);

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: Number(asig.metaIndividual ?? 0),
        cantidadAprobada,
        pagoUnitario,
        montoMeta: Number(asig.metaIndividual ?? 0) * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);

    return { detalle, montoTotal, pagoUnitario };
  }

  private async getAsignacionesActualesDeCuadrilla(cuadrillaId: number) {
    const miembros = await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);

    const miembrosActivos = miembros.filter(
      (m: any) => String(m.estado ?? "ACTIVO").toUpperCase() === "ACTIVO",
    );

    if (miembrosActivos.length === 0) {
      throw new BadRequestError(
        `La cuadrilla ${cuadrillaId} no tiene miembros activos`,
      );
    }

    const asignacionesHistoricas = await this.asignacionEmpleadoRepo.findAll({
      where: {
        cuadrillaId: { id: cuadrillaId },
        estado: "ACTIVO",
      } as any,
      order: { id: "DESC" } as any,
    });

    if (asignacionesHistoricas.length === 0) {
      throw new BadRequestError(
        `No hay asignaciones activas para la cuadrilla ${cuadrillaId}`,
      );
    }

    const asignacionesActuales = asignacionesHistoricas
      .slice(0, miembrosActivos.length)
      .reverse();

    return {
      miembrosActivos,
      asignacionesActuales,
    };
  }

  private validarEvidencia(evidencia: EvidenciaPagoType) {
    if (!evidencia.metodoPago) {
      throw new BadRequestError("El método de pago es obligatorio");
    }

    if (evidencia.montoConfirmado === undefined || evidencia.montoConfirmado < 0) {
      throw new BadRequestError("El monto confirmado es inválido");
    }

    if (evidencia.metodoPago === "TRANSFERENCIA") {
      if (!evidencia.numeroTransferencia?.trim()) {
        throw new BadRequestError(
          "El número de transferencia es obligatorio",
        );
      }
      if (!evidencia.bancoDestino?.trim()) {
        throw new BadRequestError("El banco destino es obligatorio");
      }
    }

    if (evidencia.metodoPago === "DEPOSITO") {
      if (!evidencia.bancoDestino?.trim()) {
        throw new BadRequestError("El banco destino es obligatorio");
      }
      if (!evidencia.referenciaDeposito?.trim()) {
        throw new BadRequestError(
          "La referencia del depósito es obligatoria",
        );
      }
    }

    if (evidencia.metodoPago === "CHEQUE") {
      if (!evidencia.numeroCheque?.trim()) {
        throw new BadRequestError("El número de cheque es obligatorio");
      }
      if (!evidencia.nombreBeneficiario?.trim()) {
        throw new BadRequestError(
          "El nombre del beneficiario es obligatorio",
        );
      }
    }
  }

  private buildDescripcionEvidencia(evidencia: EvidenciaPagoType) {
    const partes = [`Pago ejecutado por ${evidencia.metodoPago}`];

    if (evidencia.numeroTransferencia) {
      partes.push(`Transferencia: ${evidencia.numeroTransferencia}`);
    }
    if (evidencia.bancoDestino) {
      partes.push(`Banco: ${evidencia.bancoDestino}`);
    }
    if (evidencia.referenciaDeposito) {
      partes.push(`Referencia depósito: ${evidencia.referenciaDeposito}`);
    }
    if (evidencia.numeroCheque) {
      partes.push(`Cheque: ${evidencia.numeroCheque}`);
    }
    if (evidencia.nombreBeneficiario) {
      partes.push(`Beneficiario: ${evidencia.nombreBeneficiario}`);
    }
    if (evidencia.observaciones) {
      partes.push(`Obs: ${evidencia.observaciones}`);
    }

    return partes.join(" | ");
  }
}
