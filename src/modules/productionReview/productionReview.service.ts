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
  enrichReview,
  getRejectionPercentage,
  normalizeState,
} from "../../shared/temporal-flow";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";

const VALID_ORDER_STATES = new Set(["EN_PROCESO", "ACTIVA", "ACTIVO"]);

export class ProductionReviewService {
  private readonly repo = new RevisionProduccionRepository();
  private readonly assignmentService = new EmployeeAssignmentService();
  private readonly assignmentRepo = new AsignacionEmpleadoRepository();
  private readonly orderAssignmentRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();

  private async getRawById(id: number) {
    const revision = await this.repo.findOne({
      where: { id, fecha_eliminacion: IsNull() } as any,
      relations: { asignacionEmpleadoId: true } as any,
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
        relations: { asignacionEmpleadoId: true } as any,
        order: { id: "DESC" as any },
      }),
      this.assignmentService.getAll() as Promise<any[]>,
    ]);

    const assignmentMap = new Map(assignments.map((item: any) => [Number(item.id), item]));

    return reviews.map((review: any) => {
      const assignmentId = Number(review.asignacionEmpleadoId?.id ?? review.asignacionEmpleadoId);
      return enrichReview(review, {
        assignment: assignmentMap.get(assignmentId) ?? null,
      });
    });
  }

  private async getAssignmentContext(asignacionEmpleadoId: number) {
    const assignments = await this.assignmentService.getAll() as any[];
    const assignment = assignments.find((item) => Number(item.id) === Number(asignacionEmpleadoId));
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

    const aocId = Number(assignment.asignacionOrdenCuadrillaId);
    const aoc = Number.isFinite(aocId) ? await this.orderAssignmentRepo.findById(aocId) : null;
    const orden = aoc ? await this.ordenRepo.findById(aoc.ordenTrabajoId) : null;

    return { assignment, rawAssignment, aoc, orden };
  }

  private async getApprovedTotalForAoc(aocId: number, excludingReviewId?: number) {
    const reviews = await this.buildEnrichedReviews();
    return reviews
      .filter((item: any) => Number(item.id) !== Number(excludingReviewId))
      .filter((item: any) => Number(item.assignment?.asignacionOrdenCuadrillaId) === Number(aocId))
      .filter((item: any) => normalizeState(item.estadoRevision) === "APROBADA")
      .reduce((acc: number, item: any) => acc + Number(item.cantidadAprobada ?? 0), 0);
  }

  private async findPendingReportForAssignment(asignacionEmpleadoId: number) {
    const reviews = await this.repo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
      relations: { asignacionEmpleadoId: true } as any,
      order: { id: "DESC" as any },
    });

    return (reviews as any[]).find((review) => {
      const assignmentId = Number(review.asignacionEmpleadoId?.id ?? review.asignacionEmpleadoId);
      return assignmentId === Number(asignacionEmpleadoId) && normalizeState(review.estadoRevision) === "PENDIENTE_REVISION";
    }) ?? null;
  }

  private async validatePayload(
    payload: Pick<CreateProductionReviewDtoType, "cantidadRecibida" | "cantidadAprobada" | "observaciones" | "asignacionEmpleadoId">,
    excludingReviewId?: number,
  ) {
    if (!payload.asignacionEmpleadoId) {
      throw new BadRequestError("Debe indicar la asignación del reporte.");
    }

    const { assignment, rawAssignment, aoc, orden } = await this.getAssignmentContext(payload.asignacionEmpleadoId);

    const assignmentState = normalizeState(assignment.estado);
    if (!assignmentState.startsWith("ACTIV")) {
      throw new BadRequestError("Solo se pueden revisar asignaciones activas.");
    }

    if (!orden) {
      throw new BadRequestError("No se encontró la orden asociada al reporte.");
    }

    if (!VALID_ORDER_STATES.has(normalizeState(orden.estado))) {
      throw new BadRequestError("La orden no está en proceso o activa para revisión.");
    }

    if (normalizeState(orden.modalidad) !== "DESTAJO") {
      throw new BadRequestError("Las órdenes con modalidad PAGO_POR_DIAS no pasan por revisión de producción por pieza.");
    }

    if (payload.cantidadRecibida <= 0) {
      throw new BadRequestError("La cantidad recibida debe ser mayor a cero.");
    }

    if (payload.cantidadAprobada > payload.cantidadRecibida) {
      throw new BadRequestError("La cantidad aprobada no puede ser mayor a la cantidad recibida.");
    }

    const porcentajeRechazo = getRejectionPercentage(payload.cantidadRecibida, payload.cantidadAprobada);
    const estadoResultante = porcentajeRechazo <= 20 ? "APROBADA" : "OBSERVADA";

    if (estadoResultante === "OBSERVADA" && !payload.observaciones?.trim()) {
      throw new BadRequestError("Debes ingresar observaciones cuando el rechazo supera el 20%.");
    }

    if (aoc) {
      const approvedTotal = await this.getApprovedTotalForAoc(aoc.id, excludingReviewId);
      if (approvedTotal + payload.cantidadAprobada > Number(aoc.cantidadAsignada)) {
        throw new BadRequestError(
          `La suma aprobada (${approvedTotal + payload.cantidadAprobada}) supera lo asignado a la cuadrilla (${aoc.cantidadAsignada}).`,
        );
      }
    }

    return { assignment, rawAssignment, aoc, orden, porcentajeRechazo, estadoResultante };
  }

  async getPendingAssignments() {
    const reviews = await this.buildEnrichedReviews();
    return reviews
      .filter((item: any) => normalizeState(item.estadoRevision) === "PENDIENTE_REVISION")
      .filter((item: any) => normalizeState(item.assignment?.orden?.modalidad ?? item.assignment?.modalidad ?? "DESTAJO") === "DESTAJO")
      .map((item: any) => ({
        ...item.assignment,
        reporteId: item.id,
        cantidadReportada: Number(item.cantidadRecibida ?? 0),
        cantidadRecibida: Number(item.cantidadRecibida ?? 0),
        fechaReporte: item.fechaRevision,
        estadoRevision: item.estadoRevision,
        observacionesReporte: item.observaciones ?? null,
        review: item,
      }));
  }

  async getById(id: number) {
    const reviews = await this.buildEnrichedReviews();
    const review = reviews.find((item: any) => Number(item.id) === Number(id));
    if (!review) {
      throw new NotFoundError("Revisión de producción no encontrada");
    }
    return review;
  }

  async create(dto: CreateProductionReviewDtoType) {
    const pendingReport = dto.reporteId
      ? await this.getRawById(dto.reporteId)
      : dto.asignacionEmpleadoId
        ? await this.findPendingReportForAssignment(dto.asignacionEmpleadoId)
        : null;

    if (!pendingReport) {
      throw new BadRequestError("No se encontró un reporte pendiente para revisar.");
    }

    if (normalizeState((pendingReport as any).estadoRevision) !== "PENDIENTE_REVISION") {
      throw new BadRequestError("Solo se pueden procesar reportes en estado PENDIENTE_REVISION.");
    }

    const assignmentId = Number((pendingReport as any).asignacionEmpleadoId?.id ?? (pendingReport as any).asignacionEmpleadoId);
    const cantidadRecibida = Number(dto.cantidadRecibida ?? (pendingReport as any).cantidadRecibida);

    const validation = await this.validatePayload({
      ...dto,
      asignacionEmpleadoId: assignmentId,
      cantidadRecibida,
    }, (pendingReport as any).id);

    await this.repo.update((pendingReport as any).id, {
      cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada,
      estadoRevision: validation.estadoResultante,
      observaciones: dto.observaciones?.trim() || undefined,
      fechaRevision: dto.fechaRevision ?? new Date(),
      asignacionEmpleadoId: { id: assignmentId } as AsignacionEmpleado,
      fecha_eliminacion: null,
    } as any);

    return this.getById((pendingReport as any).id);
  }

  async update(id: number, dto: UpdateProductionReviewDtoType) {
    const current = await this.getRawById(id);
    const assignmentId = Number((current.asignacionEmpleadoId as any)?.id ?? current.asignacionEmpleadoId);
    const payload = {
      cantidadRecibida: dto.cantidadRecibida ?? current.cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada ?? current.cantidadAprobada,
      observaciones: dto.observaciones ?? current.observaciones,
      asignacionEmpleadoId: Number(dto.asignacionEmpleadoId ?? assignmentId),
    };

    const validation = await this.validatePayload(payload, id);

    await this.repo.update(id, {
      cantidadRecibida: payload.cantidadRecibida,
      cantidadAprobada: payload.cantidadAprobada,
      estadoRevision: validation.estadoResultante,
      observaciones: payload.observaciones?.trim() || undefined,
      fechaRevision: dto.fechaRevision ?? current.fechaRevision ?? new Date(),
      asignacionEmpleadoId: { id: payload.asignacionEmpleadoId } as any,
      fecha_eliminacion: null,
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getRawById(id);
    await this.repo.update(id, { fecha_eliminacion: new Date() } as any);
    return true;
  }

  async getAll() {
    return this.buildEnrichedReviews();
  }
}
