import { IsNull } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { EmpleadoRepository } from "../../repository/empleado.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { PositionWorkerRepository } from "../../repository/positionWorker.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  encodeAssignmentState,
  enrichAssignment,
  getEmployeeFullName,
  getMiembroSortDate,
  normalizeState,
  parseAssignmentState,
} from "../../shared/temporal-flow";
import {
  CreateEmployeeAssignmentDtoType,
  DistributeEmployeeAssignmentsDtoType,
  UpdateEmployeeAssignmentDtoType,
} from "./employeeAssignment.dto";

export class EmployeeAssignmentService {
  private readonly repo = new AsignacionEmpleadoRepository();
  private readonly orderAssignmentRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly cuadrillaRepo = new CuadrillaRepository();
  private readonly empleadoRepo = new EmpleadoRepository();
  private readonly miembroRepo = new MiembroCuadrillaRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly puestoRepo = new PositionWorkerRepository();
  private readonly reviewRepo = new RevisionProduccionRepository();

  private async getActiveAssignmentsRaw() {
    return this.repo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true },
      order: { id: "DESC" as any },
    });
  }

  private async getRawById(id: number) {
    const assignment = await this.repo.findOne({
      where: { id, fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true },
    });

    if (!assignment) {
      throw new NotFoundError("Asignación de empleado no encontrada");
    }

    return assignment;
  }

  private async getReviewData() {
    const reviews = await this.reviewRepo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
    });

    const approvedTotals = new Map<number, number>();
    const hasAnyReview = new Set<number>();

    for (const review of reviews) {
      const assignmentId = Number((review.asignacionEmpleadoId as any)?.id ?? review.asignacionEmpleadoId);
      if (!Number.isFinite(assignmentId)) continue;
      hasAnyReview.add(assignmentId);
      if (normalizeState(review.estadoRevision) === "APROBADA") {
        approvedTotals.set(
          assignmentId,
          (approvedTotals.get(assignmentId) ?? 0) + Number(review.cantidadAprobada ?? 0),
        );
      }
    }

    return { reviews, approvedTotals, hasAnyReview };
  }

  private async buildEnrichedAssignments() {
    const assignments = await this.getActiveAssignmentsRaw();
    const metas = assignments.map((item) => parseAssignmentState(item.estado));

    const empleadoIds = [...new Set(metas.map((item) => item.empleadoId).filter((item): item is number => item != null))];
    const aocIds = [...new Set(metas.map((item) => item.asignacionOrdenCuadrillaId).filter((item): item is number => item != null))];

    const [empleados, aocs, { approvedTotals, hasAnyReview }] = await Promise.all([
      empleadoIds.length
        ? this.empleadoRepo.findAll({ where: empleadoIds.map((id) => ({ id })) as any })
        : Promise.resolve([]),
      aocIds.length
        ? this.orderAssignmentRepo.findAll({ where: aocIds.map((id) => ({ id })) as any })
        : Promise.resolve([]),
      this.getReviewData(),
    ]);

    const employeeMap = new Map(empleados.map((item) => [item.id, item]));
    const aocMap = new Map(aocs.map((item) => [item.id, item]));

    return assignments.map((assignment) => {
      const meta = parseAssignmentState(assignment.estado);
      return enrichAssignment(assignment, {
        empleado: meta.empleadoId != null ? employeeMap.get(meta.empleadoId) ?? null : null,
        cuadrilla: (assignment.cuadrillaId as any) ?? null,
        asignacionOrdenCuadrilla:
          meta.asignacionOrdenCuadrillaId != null
            ? aocMap.get(meta.asignacionOrdenCuadrillaId) ?? null
            : null,
        approvedTotal: approvedTotals.get(assignment.id) ?? 0,
        hasAnyReview: hasAnyReview.has(assignment.id),
      });
    });
  }

  private async getMiembrosActivos(cuadrillaId: number) {
    const miembros = await this.miembroRepo.findByCuadrilla(cuadrillaId);
    const activos = miembros.filter(
      (item) => normalizeState(item.estado) === "ACTIVO" && normalizeState(item.empleado?.estado) === "ACTIVO",
    );

    const puestoIds = [...new Set(activos.map((item) => item.empleado?.pstPuesto).filter((value): value is number => value != null))];
    const puestos = await Promise.all(puestoIds.map((id) => this.puestoRepo.findById(id)));
    const puestoMap = new Map(puestos.filter(Boolean).map((puesto) => [puesto!.id, puesto!]));

    return activos
      .map((miembro) => ({
        ...miembro,
        puestoNombre: miembro.empleado?.pstPuesto != null ? puestoMap.get(miembro.empleado.pstPuesto)?.nombre ?? null : null,
        empleadoNombre: getEmployeeFullName(miembro.empleado),
      }))
      .sort((a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre, "es", { sensitivity: "base" }));
  }

  private calculateAutoDistribution(total: number, miembros: Awaited<ReturnType<EmployeeAssignmentService["getMiembrosActivos"]>>) {
    if (miembros.length === 0) {
      throw new BadRequestError("La cuadrilla no tiene miembros activos para distribuir la meta.");
    }

    const base = Math.floor(total / miembros.length);
    const sobrante = total - base * miembros.length;

    const jefe = miembros.find((item) => normalizeState(item.puestoNombre).includes("JEFE"));
    const fallback = [...miembros].sort((a, b) => getMiembroSortDate(a) - getMiembroSortDate(b))[0];
    const receiverId = (jefe ?? fallback).empleadoId;

    return miembros.map((miembro) => ({
      empleadoId: miembro.empleadoId,
      empleadoNombre: miembro.empleadoNombre,
      puestoNombre: miembro.puestoNombre,
      metaIndividual: base + (miembro.empleadoId === receiverId ? sobrante : 0),
    }));
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

  private async getAssignmentsByAoc(aocId: number) {
    const assignments = await this.getActiveAssignmentsRaw();
    return assignments.filter((item) => parseAssignmentState(item.estado).asignacionOrdenCuadrillaId === aocId);
  }

  private async validateDistribution(
    aocId: number,
    metas: { empleadoId: number; metaIndividual: number }[],
    opts?: { allowReplace?: boolean },
  ) {
    const { aoc, orden, cuadrilla } = await this.getOrderAssignmentOrFail(aocId);
    const orderState = normalizeState(orden.estado);

    if (orderState !== "ACTIVO") {
      throw new BadRequestError("Solo se pueden distribuir metas sobre órdenes ACTIVAS.");
    }

    const miembros = await this.getMiembrosActivos(aoc.cuadrillaId);
    if (!miembros.length) {
      throw new BadRequestError("La cuadrilla no tiene miembros activos.");
    }

    const miembroIds = new Set(miembros.map((item) => item.empleadoId));
    const requestedIds = metas.map((item) => item.empleadoId);
    const uniqueRequested = new Set(requestedIds);

    if (requestedIds.length !== uniqueRequested.size) {
      throw new BadRequestError("No se puede repetir un empleado en la misma distribución.");
    }

    if (requestedIds.length !== miembros.length) {
      throw new BadRequestError("Debes asignar meta a todos los miembros activos de la cuadrilla.");
    }

    const invalidEmployee = requestedIds.find((id) => !miembroIds.has(id));
    if (invalidEmployee != null) {
      throw new BadRequestError(`El empleado ${invalidEmployee} no pertenece a la cuadrilla activa.`);
    }

    const total = metas.reduce((acc, item) => acc + Number(item.metaIndividual || 0), 0);
    if (total > aoc.cantidadAsignada) {
      throw new BadRequestError(
        `La suma de metas (${total}) supera la cantidad asignada a la cuadrilla (${aoc.cantidadAsignada}).`,
      );
    }

    const existing = await this.getAssignmentsByAoc(aocId);
    if (existing.length > 0) {
      const { hasAnyReview } = await this.getReviewData();
      const locked = existing.some((item) => hasAnyReview.has(item.id));
      if (locked) {
        throw new BadRequestError(
          "Ya existen metas con producción/revisión registrada. No se pueden redistribuir.",
        );
      }

      if (!opts?.allowReplace) {
        throw new BadRequestError("Ya existen metas para esa orden y cuadrilla.");
      }
    }

    return { aoc, orden, cuadrilla, miembros, existing, total };
  }

  async getPanels() {
    const [aocs, orders, cuadrillas, assignments] = await Promise.all([
      this.orderAssignmentRepo.findAll({
        where: { fechaEliminacion: IsNull() } as any,
        order: { id: "DESC" as any },
      }),
      this.ordenRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.cuadrillaRepo.findAll({ where: { deletedAt: IsNull() } as any }),
      this.buildEnrichedAssignments(),
    ]);

    const orderMap = new Map(orders.map((item) => [item.id, item]));
    const cuadrillaMap = new Map(cuadrillas.map((item) => [item.id, item]));
    const eligibleAocs = aocs.filter((aoc) => {
  const orden = orderMap.get(aoc.ordenTrabajoId);
  return normalizeState(orden?.estado) === "ACTIVO";
});

const panels = await Promise.all(
  eligibleAocs.map(async (aoc) => {
    const orden = orderMap.get(aoc.ordenTrabajoId) ?? null;
    const cuadrilla = cuadrillaMap.get(aoc.cuadrillaId) ?? null;
    const miembros = await this.getMiembrosActivos(aoc.cuadrillaId);

    const existingAssignments = assignments.filter(
      (item) => item.asignacionOrdenCuadrillaId === aoc.id,
    );

    const assignedTotal = existingAssignments.reduce(
      (acc, item) => acc + Number(item.metaIndividual ?? 0),
      0,
    );

    const allowEdit = existingAssignments.every((item) => item.puedeEditar);

    const autoDistribution =
      miembros.length > 0
        ? this.calculateAutoDistribution(aoc.cantidadAsignada, miembros)
        : [];

    const blockedReason =
      miembros.length === 0
        ? "La cuadrilla no tiene miembros activos."
        : null;

    return {
      id: aoc.id,
      estado: normalizeState(aoc.estado),
      cantidadAsignada: aoc.cantidadAsignada,
      orden,
      cuadrilla,
      miembros,
      assignedTotal,
      remaining: aoc.cantidadAsignada - assignedTotal,
      existingAssignments,
      allowEdit,
      autoDistribution,
      canDistribute: miembros.length > 0,
      blockedReason,
    };
  }),
);

return panels;
  }

  async getById(id: number) {
    const assignments = await this.buildEnrichedAssignments();
    const match = assignments.find((item) => item.id === id);
    if (!match) {
      throw new NotFoundError("Asignación de empleado no encontrada");
    }
    return match;
  }

  async distribute(dto: DistributeEmployeeAssignmentsDtoType) {
    const base = await this.getOrderAssignmentOrFail(dto.asignacionOrdenCuadrillaId);
    const miembros = await this.getMiembrosActivos(base.aoc.cuadrillaId);
    const metas = dto.modo === "AUTOMATICA"
      ? this.calculateAutoDistribution(base.aoc.cantidadAsignada, miembros).map((item) => ({
          empleadoId: item.empleadoId,
          metaIndividual: item.metaIndividual,
        }))
      : dto.metas.map((item) => ({
          empleadoId: item.empleadoId,
          metaIndividual: Number(item.metaIndividual),
        }));

    const validated = await this.validateDistribution(dto.asignacionOrdenCuadrillaId, metas, {
      allowReplace: true,
    });

    if (validated.existing.length > 0) {
      await Promise.all(
        validated.existing.map((item) =>
          this.repo.update(item.id, { fecha_eliminacion: new Date() } as any),
        ),
      );
    }

    const created = [] as number[];

    for (const meta of metas) {
      const saved = await this.repo.save(
        this.repo.create({
          metaIndividual: meta.metaIndividual,
          estado: encodeAssignmentState("ACTIVA", validated.aoc.id, meta.empleadoId),
          cuadrillaId: { id: validated.aoc.cuadrillaId } as any,
        }),
      );
      created.push(saved.id);
    }

    const assignments = await this.buildEnrichedAssignments();
    return assignments.filter((item) => created.includes(item.id));
  }

  async create(dto: CreateEmployeeAssignmentDtoType) {
    const newAssignment = this.repo.create({
      metaIndividual: dto.metaIndividual,
      estado: normalizeState(dto.estado),
      cuadrillaId: { id: dto.cuadrillaId } as any,
    });

    const saved = await this.repo.save(newAssignment);
    return this.getById(saved.id);
    const saved = await this.repo.save(newAssignment);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateEmployeeAssignmentDtoType) {
    const current = await this.getRawById(id);
    const meta = parseAssignmentState(current.estado);
    const { hasAnyReview } = await this.getReviewData();

    if (hasAnyReview.has(id)) {
      throw new BadRequestError("Esta meta ya tiene producción/revisión registrada y no se puede editar.");
    }

    await this.repo.update(id, {
      ...(dto.metaIndividual !== undefined && { metaIndividual: dto.metaIndividual }),
      ...(dto.estado !== undefined && {
        estado: encodeAssignmentState(
          dto.estado,
          meta.asignacionOrdenCuadrillaId,
          meta.empleadoId,
        ),
      }),
      ...(dto.cuadrillaId !== undefined && { cuadrillaId: { id: dto.cuadrillaId } as any }),
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getRawById(id);
    return this.repo.update(id, { fecha_eliminacion: new Date() } as any);
  }

  async getAll() {
    return this.buildEnrichedAssignments();
  }
}
