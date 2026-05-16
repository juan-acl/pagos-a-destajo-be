import { IsNull } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateEmployeeAssignmentDtoType,
  DistributeEmployeeAssignmentsDtoType,
  SetPaymentModalityDtoType,
  UpdateEmployeeAssignmentDtoType,
} from "./employeeAssignment.dto";
import {
  encodeAssignmentState,
  getEmployeeFullName,
  normalizeState,
  parseAssignmentState,
} from "../../shared/temporal-flow";

const VALID_ASSIGNMENT_STATES = new Set(["ACTIVA", "ACTIVO"]);
const VALID_ORDER_STATES = new Set(["EN_PROCESO", "ACTIVA", "ACTIVO"]);

type MemberInfo = {
  empleadoId: number;
  empleadoNombre: string;
  puestoNombre?: string | null;
};

export class EmployeeAssignmentService {
  private readonly repo = new AsignacionEmpleadoRepository();
  private readonly orderAssignmentRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly cuadrillaRepo = new CuadrillaRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly miembroRepo = new MiembroCuadrillaRepository();
  private readonly reviewRepo = new RevisionProduccionRepository();

  private async getActiveRawRows() {
    return this.repo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true } as any,
      order: { id: "DESC" as any },
    });
  }

  private async getOrderAssignmentOrFail(id: number) {
    const aoc = await this.orderAssignmentRepo.findById(id);
    if (!aoc || aoc.fechaEliminacion) {
      throw new NotFoundError("La asignación de orden a cuadrilla no existe.");
    }

    const [orden, cuadrilla] = await Promise.all([
      this.ordenRepo.findById(aoc.ordenTrabajoId),
      this.cuadrillaRepo.findById(aoc.cuadrillaId),
    ]);

    if (!orden || orden.fechaEliminacion) {
      throw new BadRequestError("La orden de trabajo asociada no existe.");
    }

    if (!cuadrilla || cuadrilla.deletedAt) {
      throw new BadRequestError("La cuadrilla asociada no existe.");
    }

    return { aoc, orden, cuadrilla };
  }

  private async getMiembrosActivos(cuadrillaId: number) {
    const miembros = await this.miembroRepo.findByCuadrilla(cuadrillaId);
    return miembros
      .map<MemberInfo>((miembro: any) => ({
        empleadoId: Number(miembro.empleadoId),
        empleadoNombre: getEmployeeFullName(miembro.empleado),
        puestoNombre: miembro.empleado?.puesto?.nombre ?? miembro.empleado?.pstPuesto?.nombre ?? null,
      }))
      .filter((miembro) => Number.isFinite(miembro.empleadoId));
  }

  private async getReviewStats() {
    const reviews = await this.reviewRepo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
      relations: { asignacionEmpleadoId: true } as any,
    });

    const stats = new Map<number, { approved: number; hasReview: boolean; pending: number }>();
    for (const review of reviews as any[]) {
      const assignmentId = Number(review.asignacionEmpleadoId?.id ?? review.asignacionEmpleadoId);
      if (!Number.isFinite(assignmentId)) continue;

      const current = stats.get(assignmentId) ?? { approved: 0, hasReview: false, pending: 0 };
      current.hasReview = true;
      const state = normalizeState(review.estadoRevision);
      if (state === "APROBADA" || state === "APROBADO") {
        current.approved += Number(review.cantidadAprobada ?? 0);
      }
      if (state === "PENDIENTE_REVISION") {
        current.pending += 1;
      }
      stats.set(assignmentId, current);
    }

    return stats;
  }

  private buildAssignmentMap(rows: any[]) {
    const map = new Map<string, any>();
    for (const row of rows) {
      const meta = parseAssignmentState(row.estado);
      if (meta.asignacionOrdenCuadrillaId == null || meta.empleadoId == null) continue;
      map.set(`${meta.asignacionOrdenCuadrillaId}:${meta.empleadoId}`, row);
    }
    return map;
  }

  private async enrichRows(rows: any[]) {
    const [aocs, orders, cuadrillas, miembrosAll, reviewStats] = await Promise.all([
      this.orderAssignmentRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.ordenRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.cuadrillaRepo.findAll({ where: { deletedAt: IsNull() } as any }),
      this.miembroRepo.findAll(),
      this.getReviewStats(),
    ]);

    const aocMap = new Map(aocs.map((item: any) => [Number(item.id), item]));
    const orderMap = new Map(orders.map((item: any) => [Number(item.id), item]));
    const cuadrillaMap = new Map(cuadrillas.map((item: any) => [Number(item.id), item]));
    const memberMap = new Map(
      miembrosAll.map((item: any) => [Number(item.empleadoId), item]),
    );

    return rows.map((row: any) => {
      const meta = parseAssignmentState(row.estado);
      const stats = reviewStats.get(Number(row.id)) ?? { approved: 0, hasReview: false, pending: 0 };
      const aoc = meta.asignacionOrdenCuadrillaId != null ? aocMap.get(meta.asignacionOrdenCuadrillaId) : null;
      const orden = aoc ? orderMap.get(Number(aoc.ordenTrabajoId)) : null;
      const cuadrilla = aoc ? cuadrillaMap.get(Number(aoc.cuadrillaId)) : row.cuadrillaId;
      const miembro = meta.empleadoId != null ? memberMap.get(meta.empleadoId) : null;
      const modalidad = normalizeState(orden?.modalidad ?? "DESTAJO");
      const estado = normalizeState(meta.estadoBase || row.estado);
      const cantidadReferencia = Number(aoc?.cantidadAsignada ?? 0);

      return {
        ...row,
        estado,
        estadoRaw: row.estado,
        empleadoId: meta.empleadoId,
        empleadoNombre: getEmployeeFullName(miembro?.empleado),
        asignacionOrdenCuadrillaId: meta.asignacionOrdenCuadrillaId,
        ordenTrabajoId: aoc?.ordenTrabajoId ?? null,
        orden,
        modalidad,
        cantidadAsignadaCuadrilla: cantidadReferencia,
        cantidadReferencia,
        cantidadAprobadaAcumulada: stats.approved,
        reportesPendientes: stats.pending,
        cantidadPendiente: Math.max(cantidadReferencia - stats.approved, 0),
        puedeEditar: !stats.hasReview,
        cuadrilla: cuadrilla
          ? {
              id: Number(cuadrilla.id ?? cuadrilla.cuadrillaId),
              nombre: cuadrilla.nombre,
              codigoCuadrilla: cuadrilla.codigoCuadrilla ?? null,
            }
          : null,
      };
    });
  }

  async getPanels() {
    const [aocs, orders, cuadrillas, rows, reviewStats] = await Promise.all([
      this.orderAssignmentRepo.findAll({
        where: { fechaEliminacion: IsNull() } as any,
        order: { id: "DESC" as any },
      }),
      this.ordenRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.cuadrillaRepo.findAll({ where: { deletedAt: IsNull() } as any }),
      this.getActiveRawRows(),
      this.getReviewStats(),
    ]);

    const orderMap = new Map(orders.map((item: any) => [Number(item.id), item]));
    const cuadrillaMap = new Map(cuadrillas.map((item: any) => [Number(item.id), item]));
    const assignmentMap = this.buildAssignmentMap(rows);

    return Promise.all(
      aocs.map(async (aoc: any) => {
        const orden = orderMap.get(Number(aoc.ordenTrabajoId)) ?? null;
        const cuadrilla = cuadrillaMap.get(Number(aoc.cuadrillaId)) ?? null;
        const miembros = await this.getMiembrosActivos(Number(aoc.cuadrillaId));
        const existingAssignments = miembros
          .map((miembro) => assignmentMap.get(`${aoc.id}:${miembro.empleadoId}`))
          .filter(Boolean)
          .map((row: any) => {
            const stats = reviewStats.get(Number(row.id)) ?? { approved: 0, hasReview: false, pending: 0 };
            const meta = parseAssignmentState(row.estado);
            return {
              ...row,
              estado: normalizeState(meta.estadoBase || row.estado),
              estadoRaw: row.estado,
              empleadoId: meta.empleadoId,
              empleadoNombre: miembros.find((m) => m.empleadoId === meta.empleadoId)?.empleadoNombre ?? "Empleado sin nombre",
              asignacionOrdenCuadrillaId: meta.asignacionOrdenCuadrillaId,
              ordenTrabajoId: aoc.ordenTrabajoId,
              modalidad: normalizeState(orden?.modalidad ?? "DESTAJO"),
              cantidadAprobadaAcumulada: stats.approved,
              reportesPendientes: stats.pending,
              puedeEditar: !stats.hasReview,
              cuadrilla,
            };
          });

        const activeAssignments = existingAssignments.filter((item: any) =>
          VALID_ASSIGNMENT_STATES.has(normalizeState(item.estado)),
        );
        const assignedEmployeeIds = new Set(activeAssignments.map((item: any) => Number(item.empleadoId)));
        const missingMembers = miembros.filter((miembro) => !assignedEmployeeIds.has(miembro.empleadoId));
        const modalidad = normalizeState(orden?.modalidad ?? "DESTAJO");
        const ordenHabilitada = orden ? VALID_ORDER_STATES.has(normalizeState(orden.estado)) : false;
        const blockedReason = !orden
          ? "La orden asociada no existe."
          : !ordenHabilitada
            ? "La orden debe estar EN_PROCESO/ACTIVA para sincronizar empleados."
            : null;

        return {
          id: Number(aoc.id),
          estado: normalizeState(aoc.estado),
          cantidadAsignada: Number(aoc.cantidadAsignada ?? 0),
          modalidad,
          orden,
          cuadrilla,
          miembros,
          miembrosActivos: miembros.length,
          assignedTotal: activeAssignments.length,
          remaining: missingMembers.length,
          missingMembers,
          allowEdit: !blockedReason,
          ordenHabilitada,
          blockedReason,
          pagoUnitario: Number(orden?.pagoUnitario ?? 0),
          existingAssignments,
          autoDistribution: miembros.map((miembro) => ({ empleadoId: miembro.empleadoId, metaIndividual: 0 })),
          requiereRegistroDias: modalidad === "PAGO_POR_DIAS",
          requiereRevisionProduccion: modalidad === "DESTAJO",
        };
      }),
    );
  }

  /**
   * La modalidad ya NO se registra desde este módulo.
   * La orden de trabajo conserva la responsabilidad de definir si es DESTAJO o PAGO_POR_DIAS.
   */
  async setPaymentModality(_dto: SetPaymentModalityDtoType, _role?: string | string[] | null) {
    throw new BadRequestError(
      "La modalidad se define en Órdenes de Trabajo. Este módulo solo sincroniza empleados de la cuadrilla.",
    );
  }

  async distribute(dto: DistributeEmployeeAssignmentsDtoType) {
    const { aoc, orden } = await this.getOrderAssignmentOrFail(dto.asignacionOrdenCuadrillaId);
    const orderState = normalizeState(orden.estado);
    if (!VALID_ORDER_STATES.has(orderState)) {
      throw new BadRequestError("La orden debe estar EN_PROCESO o ACTIVA para sincronizar empleados.");
    }

    const miembros = await this.getMiembrosActivos(Number(aoc.cuadrillaId));
    if (miembros.length === 0) {
      throw new BadRequestError("La cuadrilla no tiene miembros activos para asignar.");
    }

    const rows = await this.getActiveRawRows();
    const existingMap = this.buildAssignmentMap(rows);
    const activeEmployeeIds = new Set(miembros.map((m) => m.empleadoId));
    const saved: any[] = [];

    for (const miembro of miembros) {
      const key = `${aoc.id}:${miembro.empleadoId}`;
      const existing = existingMap.get(key);
      const estado = encodeAssignmentState("ACTIVA", Number(aoc.id), miembro.empleadoId);

      if (existing) {
        const updated = await this.repo.update(existing.id, {
          metaIndividual: 0,
          estado,
          cuadrillaId: { id: aoc.cuadrillaId } as any,
        } as any);
        if (updated) saved.push(updated);
      } else {
        const created = await this.repo.save(
          this.repo.create({
            metaIndividual: 0,
            estado,
            cuadrillaId: { id: aoc.cuadrillaId } as any,
          }),
        );
        saved.push(created);
      }
    }

    const rowsForAoc = rows.filter((row: any) => {
      const meta = parseAssignmentState(row.estado);
      return meta.asignacionOrdenCuadrillaId === Number(aoc.id);
    });

    await Promise.all(
      rowsForAoc
        .filter((row: any) => {
          const meta = parseAssignmentState(row.estado);
          return meta.empleadoId != null && !activeEmployeeIds.has(meta.empleadoId);
        })
        .map((row: any) => {
          const meta = parseAssignmentState(row.estado);
          return this.repo.update(row.id, {
            estado: encodeAssignmentState("INACTIVA", Number(aoc.id), meta.empleadoId),
          } as any);
        }),
    );

    return {
      asignacionOrdenCuadrillaId: Number(aoc.id),
      modalidad: normalizeState(orden.modalidad ?? "DESTAJO"),
      empleadosSincronizados: saved.length,
      mensaje:
        normalizeState(orden.modalidad) === "PAGO_POR_DIAS"
          ? "Empleados sincronizados. El registro y pago de días se mantiene en Gestión de Días."
          : "Empleados sincronizados para reportes y revisión de producción por destajo.",
    };
  }

  async getById(id: number) {
    const row = await this.repo.findOne({
      where: { id, fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true } as any,
    });

    if (!row) {
      throw new NotFoundError("Asignación de empleado no encontrada");
    }

    const [enriched] = await this.enrichRows([row]);
    return enriched;
  }

  async create(dto: CreateEmployeeAssignmentDtoType) {
    const newAssignment = this.repo.create({
      metaIndividual: dto.metaIndividual ?? 0,
      estado: normalizeState(dto.estado ?? "ACTIVA"),
      cuadrillaId: { id: dto.cuadrillaId } as any,
    });

    const saved = await this.repo.save(newAssignment);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateEmployeeAssignmentDtoType) {
    await this.getById(id);
    await this.repo.update(id, {
      ...(dto.metaIndividual !== undefined && { metaIndividual: dto.metaIndividual }),
      ...(dto.estado !== undefined && { estado: normalizeState(dto.estado) }),
      ...(dto.cuadrillaId !== undefined && { cuadrillaId: { id: dto.cuadrillaId } as any }),
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    const current = await this.getById(id);
    const estado = current.asignacionOrdenCuadrillaId && current.empleadoId
      ? encodeAssignmentState("INACTIVA", current.asignacionOrdenCuadrillaId, current.empleadoId)
      : "INACTIVA";
    return this.repo.update(id, { estado } as any);
  }

  async getAll() {
    const rows = await this.getActiveRawRows();
    return this.enrichRows(rows);
  }
}
