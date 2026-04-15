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

    await this.inactivarAsignacionesDePlanilla(planilla.id);

    return planilla;
  }

  private async inactivarAsignacionesDePlanilla(planillaId: number) {
    const planilla = await this.planillaRepo.findOne({
      where: { id: planillaId },
      relations: { loteProduccion: true },
    });

    if (!planilla) {
      throw new NotFoundError("Planilla no encontrada");
    }

    const lote = planilla.loteProduccion as LoteProduccion;

    const loteConRevision = await this.loteRepo.findOne({
      where: { id: lote.id },
      relations: { revisionProduccionId: true },
    });

    const revision = loteConRevision?.revisionProduccionId;
    if (!revision) {
      throw new NotFoundError("El lote no tiene revisión asociada");
    }

    const revisionCompleta = await this.revisionRepo.findOne({
      where: { id: revision.id } as any,
      relations: { asignacion: { cuadrillaId: true } } as any,
    });

    const asignacionBase = revisionCompleta?.asignacion;
    if (!asignacionBase) {
      throw new NotFoundError("La revisión no tiene asignación relacionada");
    }

    const cuadrillaId = (asignacionBase.cuadrillaId as any)?.id;
    if (!cuadrillaId) {
      throw new NotFoundError("No se encontró la cuadrilla de la asignación");
    }

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    for (const asignacion of asignaciones) {
      asignacion.estado = "INACTIVA";
      await this.asignacionEmpleadoRepo.save(asignacion);
    }
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
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });

    if (!orden) {
      throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);
    }

    if (orden.estado !== "COMPLETADA") {
      throw new BadRequestError(
        `La orden ${ordenId} no está COMPLETADA`,
      );
    }

    return this.calcularDetallePorOrden(ordenId);
  }

  async generarPlanillaByOrden(ordenId: number) {
    const orden = await this.ordenRepo.findOne({ where: { id: ordenId } });

    if (!orden) {
      throw new NotFoundError(`Orden de trabajo ${ordenId} no encontrada`);
    }

    if (orden.estado !== "COMPLETADA") {
      throw new BadRequestError(
        `La orden ${ordenId} no está COMPLETADA`,
      );
    }

    const { detalle, montoTotal } = await this.calcularDetallePorOrden(ordenId);

    if (detalle.length === 0 || montoTotal <= 0) {
      throw new BadRequestError(
        "La orden no tiene revisiones aprobadas con monto pagable",
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
      where: { id: revision.id } as any,
      relations: { asignacion: { cuadrillaId: true } } as any,
    });
    const asignacionBase = revConAsig?.asignacion;

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

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    const asignacionIds = asignaciones.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
        asignacion: { id: In(asignacionIds) as any },
      } as any,
      relations: { asignacion: true } as any,
    });

    const miembros =
      await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${asig.id}`;

      const rev = revisiones.find(
        (r) =>
          Number((r.asignacion as any)?.id ?? r.asignacionEmpleadoId) === asig.id,
      );
      const cantidadAprobada = rev?.cantidadAprobada ?? 0;

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: asig.metaIndividual,
        cantidadAprobada,
        pagoUnitario,
        montoMeta: asig.metaIndividual * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { planilla, lote, detalle, montoTotal, pagoUnitario };
  }

  async getOrdenesDisponibles() {
    const ordenes = await this.ordenRepo.findAll({
      where: { estado: "COMPLETADA" },
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
      where: { id: In(revisionIds) } as any,
      relations: { asignacion: { cuadrillaId: true } } as any,
    });

    const cuadrillaIds = [
      ...new Set(
        revisiones
          .map((r) => (r.asignacion?.cuadrillaId as any)?.id as number)
          .filter(Boolean),
      ),
    ];
    if (cuadrillaIds.length === 0) return ordenes;

    const asignacionesOrden = await this.asignacionRepo.findAll({
      where: { cuadrillaId: In(cuadrillaIds) as any } as any,
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
    const pagoUnitario = Number(orden.pagoUnitario);

    const miembros =
      await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    if (asignaciones.length === 0) {
      throw new BadRequestError(
        `No hay asignaciones de empleados para la cuadrilla ${cuadrillaId}`,
      );
    }

    const asignacionIds = asignaciones.map((a) => a.id);
    const revisiones = await this.revisionRepo.findAll({
      where: [
        {
          estadoRevision: "APROBADO",
          asignacion: { id: In(asignacionIds) as any },
        },
        {
          estadoRevision: "APROBADA",
          asignacion: { id: In(asignacionIds) as any },
        },
      ] as any,
      relations: { asignacion: true } as any,
    });

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${asig.id}`;

      const rev = revisiones.find(
        (r) =>
          Number((r.asignacion as any)?.id ?? r.asignacionEmpleadoId) === asig.id,
      );
      const cantidadAprobada = rev?.cantidadAprobada ?? 0;

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: asig.metaIndividual,
        cantidadAprobada,
        pagoUnitario,
        montoMeta: asig.metaIndividual * pagoUnitario,
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

  const asignacionesEmpleado = await this.asignacionEmpleadoRepo.findAll({
    where: { cuadrillaId: { id: asignacionOrden.cuadrillaId } } as any,
  });

  if (asignacionesEmpleado.length === 0) {
    throw new NotFoundError(
      `No existen asignaciones de empleados para la cuadrilla ${asignacionOrden.cuadrillaId}`,
    );
  }

  const asignacionIds = asignacionesEmpleado.map((a) => a.id);

  const revisiones = await this.revisionRepo.findAll({
    where: [
      {
        estadoRevision: "APROBADO",
        asignacion: { id: In(asignacionIds) as any },
      },
      {
        estadoRevision: "APROBADA",
        asignacion: { id: In(asignacionIds) as any },
      },
    ] as any,
    relations: { asignacion: true } as any,
  });

  if (revisiones.length === 0) {
    throw new NotFoundError(
      `No existen revisiones aprobadas para la orden ${ordenId}`,
    );
  }

  const revisionIds = revisiones.map((r) => r.id);

  const lotes = await this.loteRepo.findAll({
    where: {
      revisionProduccionId: { id: In(revisionIds) as any },
    } as any,
    relations: { revisionProduccionId: true } as any,
  });

  if (lotes.length === 0) {
    throw new NotFoundError(
      `No existe lote vinculado a revisiones aprobadas para la orden ${ordenId}`,
    );
  }

  const loteAprobado =
    lotes.find((l) => String(l.estado).toUpperCase() === "APROBADO") ?? lotes[0];

  return loteAprobado;
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
      where: { id: lote.id } as any,
      relations: { revisionProduccionId: true } as any,
    });

    const revisionBase = loteConRevision?.revisionProduccionId;
    if (!revisionBase) {
      throw new NotFoundError("El lote no tiene revisión asociada");
    }

    const revisionCompleta = await this.revisionRepo.findOne({
      where: { id: revisionBase.id } as any,
      relations: { asignacion: { cuadrillaId: true } } as any,
    });

    const cuadrillaId = (revisionCompleta?.asignacion?.cuadrillaId as any)?.id;
    if (!cuadrillaId) {
      throw new NotFoundError(
        "No se pudo determinar la cuadrilla del lote para calcular la planilla",
      );
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

    const asignaciones = await this.asignacionEmpleadoRepo.findAll({
      where: { cuadrillaId: { id: cuadrillaId } } as any,
    });

    const asignacionIds = asignaciones.map((a) => a.id);

    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
        asignacion: { id: In(asignacionIds) as any },
      } as any,
      relations: { asignacion: true } as any,
    });

    const miembros =
      await this.miembroCuadrillaRepo.findByCuadrilla(cuadrillaId);

    const detalle: DetalleEmpleado[] = asignaciones.map((asig, i) => {
      const miembro = miembros[i];
      const emp = miembro?.empleado;
      const nombre = emp
        ? `${emp.primerNombre} ${emp.primerApellido}`
        : `Empleado-${asig.id}`;

      const rev = revisiones.find(
        (r) =>
          Number((r.asignacion as any)?.id ?? r.asignacionEmpleadoId) === asig.id,
      );
      const cantidadAprobada = rev?.cantidadAprobada ?? 0;

      return {
        empleadoId: miembro?.empleadoId ?? asig.id,
        nombreEmpleado: nombre,
        metaIndividual: asig.metaIndividual,
        cantidadAprobada,
        pagoUnitario,
        montoMeta: asig.metaIndividual * pagoUnitario,
        montoRealizado: cantidadAprobada * pagoUnitario,
      };
    });

    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);

    return { detalle, montoTotal, pagoUnitario };
  }

  private validarEvidencia(evidencia: EvidenciaPagoType) {
    switch (evidencia.metodoPago) {
      case "TRANSFERENCIA":
        if (
          !evidencia.bancoDestino ||
          !evidencia.numeroCuenta ||
          !evidencia.numeroTransferencia
        ) {
          throw new BadRequestError(
            "Para transferencia se requiere: bancoDestino, numeroCuenta, numeroTransferencia",
          );
        }
        break;

      case "CHEQUE":
        if (
          !evidencia.numeroCheque ||
          !evidencia.bancoEmisor ||
          !evidencia.fechaCheque
        ) {
          throw new BadRequestError(
            "Para cheque se requiere: numeroCheque, bancoEmisor, fechaCheque",
          );
        }
        break;

      case "EFECTIVO":
        if (!evidencia.responsableEntrega || !evidencia.fechaEntrega) {
          throw new BadRequestError(
            "Para efectivo se requiere: responsableEntrega, fechaEntrega",
          );
        }
        break;

      default:
        throw new BadRequestError("Método de pago no válido");
    }
  }

  private buildDescripcionEvidencia(evidencia: EvidenciaPagoType): string {
    switch (evidencia.metodoPago) {
      case "TRANSFERENCIA":
        return `Transferencia: ${evidencia.bancoDestino} | Cuenta: ${evidencia.numeroCuenta} | Ref: ${evidencia.numeroTransferencia}`;
      case "CHEQUE":
        return `Cheque: ${evidencia.numeroCheque} | Banco: ${evidencia.bancoEmisor} | Fecha: ${evidencia.fechaCheque}`;
      case "EFECTIVO":
        return `Efectivo: Responsable: ${evidencia.responsableEntrega} | Fecha: ${evidencia.fechaEntrega}`;
      default:
        return "Pago registrado";
    }
  }
}