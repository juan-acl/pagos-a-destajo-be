import { IsNull } from "typeorm";
import { AsignacionEmpleado } from "../../entity/employeeAssignment.entity";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateProductionReviewDtoType,
  UpdateProductionReviewDtoType,
} from "./productionReview.dto";
import { EmployeeAssignmentService } from "../employeeAssignment/employeeAssignment.service";
import {
  encodeAssignmentState,
  enrichReview,
  getRejectionPercentage,
  normalizeState,
  parseAssignmentState,
} from "../../shared/temporal-flow";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";

export class ProductionReviewService {
  private readonly repo = new RevisionProduccionRepository();
  private readonly assignmentService = new EmployeeAssignmentService();
  private readonly assignmentRepo = new AsignacionEmpleadoRepository();
  private readonly orderAssignmentRepo = new AsignacionOrdenCuadrillaRepository();

  private async getRawById(id: number) {
    const revision = await this.repo.findOne({
      where: { id, fecha_eliminacion: IsNull() } as any,
      relations: { asignacion: true } as any,
    });

    if (!revision) {
      throw new NotFoundError("Revisión de producción no encontrada");
    }

    return revision;
  }

  private async buildEnrichedReviews() {
    const [reviews, assignments] = await Promise.all([
      this.repo.findAll({
        where: { fecha_eliminacion: IsNull() } as any,
        relations: { asignacion: true } as any,
        order: { id: "DESC" as any },
      }),
      this.assignmentService.getAll(),
    ]);

    const assignmentMap = new Map(assignments.map((item: any) => [item.id, item]));

    return reviews.map((review: any) => {
      const assignmentId = Number(review.asignacion?.id ?? review.asignacionEmpleadoId);
      return enrichReview(review, {
        assignment: assignmentMap.get(assignmentId) ?? null,
      });
    });
  }

  private async getAssignmentContext(asignacionEmpleadoId: number) {
    const assignments = (await this.assignmentService.getAll()) as any[];
    const assignment = assignments.find((item) => item.id === asignacionEmpleadoId);

    if (!assignment) {
      throw new BadRequestError("La asignación de empleado indicada no existe.");
    }

    const rawAssignment = await this.assignmentRepo.findOne({
      where: { id: asignacionEmpleadoId, fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true } as any,
    });

    if (!rawAssignment) {
      throw new BadRequestError("La asignación de empleado indicada no existe.");
    }

    const meta = parseAssignmentState(rawAssignment.estado);
    const aoc =
      meta.asignacionOrdenCuadrillaId != null
        ? await this.orderAssignmentRepo.findById(meta.asignacionOrdenCuadrillaId)
        : null;

    return { assignment, rawAssignment, aoc, meta };
  }

  private async getApprovedTotalForAoc(aocId: number, excludingReviewId?: number) {
    const reviews = await this.buildEnrichedReviews();

    return reviews
      .filter((item: any) => item.id !== excludingReviewId)
      .filter((item: any) => item.assignment?.asignacionOrdenCuadrillaId === aocId)
      .filter((item: any) => normalizeState(item.estadoRevision) === "APROBADA")
      .reduce((acc: number, item: any) => acc + Number(item.cantidadAprobada ?? 0), 0);
  }

  private async validatePayload(
    payload: Pick<
      CreateProductionReviewDtoType,
      "cantidadRecibida" | "cantidadAprobada" | "observaciones" | "asignacionEmpleadoId"
    >,
    excludingReviewId?: number,
  ) {
    const { assignment, rawAssignment, aoc, meta } = await this.getAssignmentContext(
      payload.asignacionEmpleadoId,
    );

    if (normalizeState(assignment.estado) !== "ACTIVA") {
      throw new BadRequestError("Solo se pueden revisar asignaciones activas.");
    }

    const reviews = await this.buildEnrichedReviews();
    const existingForAssignment = reviews.find(
      (item: any) =>
        item.id !== excludingReviewId &&
        Number(item.assignment?.id) === payload.asignacionEmpleadoId,
    );

    if (existingForAssignment) {
      throw new BadRequestError("Esa asignación ya fue revisada anteriormente.");
    }

    if (payload.cantidadRecibida <= 0) {
      throw new BadRequestError("La cantidad recibida debe ser mayor a cero.");
    }

    if (payload.cantidadAprobada > payload.cantidadRecibida) {
      throw new BadRequestError(
        "La cantidad aprobada no puede ser mayor a la cantidad recibida.",
      );
    }

    if (payload.cantidadRecibida > Number(assignment.metaIndividual)) {
      throw new BadRequestError("La cantidad recibida no puede ser mayor a la meta asignada.");
    }

    const porcentajeRechazo = getRejectionPercentage(
      payload.cantidadRecibida,
      payload.cantidadAprobada,
    );

    const estadoResultante = porcentajeRechazo <= 20 ? "APROBADA" : "OBSERVADA";

    if (estadoResultante === "OBSERVADA" && !payload.observaciones?.trim()) {
      throw new BadRequestError(
        "Debes ingresar observaciones cuando el rechazo supera el 20%.",
      );
    }

    if (aoc) {
      const approvedTotal = await this.getApprovedTotalForAoc(aoc.id, excludingReviewId);

      if (approvedTotal + payload.cantidadAprobada > Number(aoc.cantidadAsignada)) {
        throw new BadRequestError(
          `La suma aprobada (${approvedTotal + payload.cantidadAprobada}) supera lo asignado a la cuadrilla (${aoc.cantidadAsignada}).`,
        );
      }
    }

    return { assignment, rawAssignment, meta, porcentajeRechazo, estadoResultante };
  }

  async getPendingAssignments() {
    const [assignments, reviews] = await Promise.all([
      this.assignmentService.getAll() as Promise<any[]>,
      this.buildEnrichedReviews(),
    ]);

    const reviewedAssignmentIds = new Set(
      reviews.map((item: any) => Number(item.assignment?.id)).filter(Number.isFinite),
    );

    return assignments.filter(
      (item: any) =>
        normalizeState(item.estado) === "ACTIVA" && !reviewedAssignmentIds.has(item.id),
    );
  }

  async getById(id: number) {
    const reviews = await this.buildEnrichedReviews();
    const review = reviews.find((item: any) => item.id === id);

    if (!review) {
      throw new NotFoundError("Revisión de producción no encontrada");
    }

    return review;
  }

  async create(dto: CreateProductionReviewDtoType) {
    const validation = await this.validatePayload(dto);

    const newReview = this.repo.create({
      cantidadRecibida: dto.cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada,
      estadoRevision: validation.estadoResultante,
      observaciones: dto.observaciones?.trim() || undefined,
      fechaRevision: dto.fechaRevision ?? new Date(),
      asignacion: { id: dto.asignacionEmpleadoId } as AsignacionEmpleado,
    } as any);

    const saved = await this.repo.save(newReview);

    if (validation.estadoResultante === "APROBADA") {
      await this.assignmentRepo.update(dto.asignacionEmpleadoId, {
        estado: encodeAssignmentState(
          "ACTIVA",
          validation.meta.asignacionOrdenCuadrillaId,
          validation.meta.empleadoId,
        ),
      } as any);
    }

    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateProductionReviewDtoType) {
    const current = await this.getRawById(id);

    const currentAssignmentId = Number(
      (current as any).asignacion?.id ?? (current as any).asignacionEmpleadoId,
    );

    const payload = {
      cantidadRecibida: dto.cantidadRecibida ?? current.cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada ?? current.cantidadAprobada,
      observaciones: dto.observaciones ?? current.observaciones,
      asignacionEmpleadoId: Number(dto.asignacionEmpleadoId ?? currentAssignmentId),
    };

    const validation = await this.validatePayload(payload, id);

    current.cantidadRecibida = payload.cantidadRecibida;
    current.cantidadAprobada = payload.cantidadAprobada;
    current.estadoRevision = validation.estadoResultante;
    current.observaciones = payload.observaciones?.trim() || undefined;
    current.fechaRevision = dto.fechaRevision ?? current.fechaRevision ?? new Date();
    (current as any).asignacion = {
      id: payload.asignacionEmpleadoId,
    } as AsignacionEmpleado;
    current.fecha_eliminacion = null;

    await this.repo.save(current as any);

    await this.assignmentRepo.update(payload.asignacionEmpleadoId, {
      estado: encodeAssignmentState(
        validation.estadoResultante === "APROBADA" ? "ACTIVA" : "ACTIVA",
        validation.meta.asignacionOrdenCuadrillaId,
        validation.meta.empleadoId,
      ),
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    const current = await this.getRawById(id);

    const assignmentId = Number(
      (current as any).asignacion?.id ?? (current as any).asignacionEmpleadoId,
    );

    const context = await this.getAssignmentContext(assignmentId);

    await this.repo.update(id, { fecha_eliminacion: new Date() } as any);

    await this.assignmentRepo.update(assignmentId, {
      estado: encodeAssignmentState(
        "ACTIVA",
        context.meta.asignacionOrdenCuadrillaId,
        context.meta.empleadoId,
      ),
    } as any);

    return true;
  }

  async getAll() {
    return this.buildEnrichedReviews();
  }
}
