import { IsNull } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import {
  CreateProductionLotDtoType,
  UpdateProductionLotDtoType,
} from "./productionLot.dto";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import { EmployeeAssignmentService } from "../employeeAssignment/employeeAssignment.service";
import { ProductionReviewService } from "../productionReview/productionReview.service";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { normalizeState } from "../../shared/temporal-flow";

export class ProductionLotService {
  private readonly repo = new LoteProduccionRepository();
  private readonly reviewRepo = new RevisionProduccionRepository();
  private readonly assignmentService = new EmployeeAssignmentService();
  private readonly reviewService = new ProductionReviewService();
  private readonly aocRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly cuadrillaRepo = new CuadrillaRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();

  private async buildCandidates() {
    const [aocs, orders, cuadrillas, assignments, reviews, lots] = await Promise.all([
      this.aocRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.ordenRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.cuadrillaRepo.findAll({ where: { deletedAt: IsNull() } as any }),
      this.assignmentService.getAll() as Promise<any[]>,
      this.reviewService.getAll() as Promise<any[]>,
      this.repo.findAll({
        where: { fechaEliminacion: IsNull() } as any,
        relations: { revisionProduccionId: { asignacionEmpleadoId: true } } as any,
      }),
    ]);

    const orderMap = new Map(orders.map((item: any) => [Number(item.id), item]));
    const cuadrillaMap = new Map(cuadrillas.map((item: any) => [Number(item.id), item]));

    return aocs.map((aoc: any) => {
      const orden = orderMap.get(Number(aoc.ordenTrabajoId)) ?? null;
      const cuadrilla = cuadrillaMap.get(Number(aoc.cuadrillaId)) ?? null;
      const modalidad = normalizeState(orden?.modalidad ?? "DESTAJO");
      const currentAssignments = assignments.filter(
        (item: any) => Number(item.asignacionOrdenCuadrillaId) === Number(aoc.id),
      );
      const currentReviews = reviews.filter(
        (item: any) => Number(item.assignment?.asignacionOrdenCuadrillaId) === Number(aoc.id),
      );
      const pendingReports = currentReviews.filter(
        (item: any) => normalizeState(item.estadoRevision) === "PENDIENTE_REVISION",
      );
      const observedReviews = currentReviews.filter(
        (item: any) => normalizeState(item.estadoRevision) === "OBSERVADA",
      );
      const approvedReviews = currentReviews.filter(
        (item: any) => normalizeState(item.estadoRevision) === "APROBADA",
      );
      const totalAprobado = approvedReviews.reduce(
        (acc: number, item: any) => acc + Number(item.cantidadAprobada ?? 0),
        0,
      );

      const openLot = lots.find((lot: any) => {
        const relatedReview: any = lot.revisionProduccionId;
        const relatedAssignmentId = Number(relatedReview?.asignacionEmpleadoId?.id ?? relatedReview?.asignacionEmpleadoId);
        const relatedAssignment = assignments.find((item: any) => Number(item.id) === relatedAssignmentId);
        return (
          Number(relatedAssignment?.asignacionOrdenCuadrillaId) === Number(aoc.id) &&
          ["ACTIVA", "ACTIVO", "APROBADO", "APROBADA"].includes(normalizeState(lot.estado))
        );
      });

      const blockers: string[] = [];
      if (modalidad !== "DESTAJO") {
        blockers.push("Los lotes solo aplican para órdenes con modalidad DESTAJO. Las órdenes por día se liquidan desde Gestión de Días/Planilla.");
      }
      if (currentAssignments.length === 0) {
        blockers.push("Primero debes sincronizar los empleados de la cuadrilla en Asignaciones.");
      }
      if (pendingReports.length > 0) {
        blockers.push("Hay reportes pendientes de revisión para esta orden y cuadrilla.");
      }
      if (totalAprobado <= 0) {
        blockers.push("No hay producción aprobada para generar el lote.");
      }
      if (orden && normalizeState(orden.estado) === "VENCIDA") {
        blockers.push("La orden está vencida.");
      }
      if (openLot) {
        blockers.push("Ya existe un lote abierto para esta orden y cuadrilla.");
      }

      return {
        id: Number(aoc.id),
        cantidadAsignada: Number(aoc.cantidadAsignada ?? 0),
        modalidad,
        orden,
        cuadrilla,
        assignments: currentAssignments,
        reviews: currentReviews,
        pendingAssignments: pendingReports.map((item: any) => item.assignment).filter(Boolean),
        pendingReports,
        observedReviews,
        approvedReviews,
        totalAprobado,
        montoTotal: orden ? Number(totalAprobado) * Number(orden.pagoUnitario ?? 0) : 0,
        canGenerate: blockers.length === 0,
        blockers,
      };
    });
  }

  private async enrichLots() {
    const [lots, reviews, candidates] = await Promise.all([
      this.repo.findAll({
        where: { fechaEliminacion: IsNull() } as any,
        relations: { revisionProduccionId: true } as any,
        order: { id: "DESC" as any },
      }),
      this.reviewService.getAll() as Promise<any[]>,
      this.buildCandidates(),
    ]);

    const reviewMap = new Map(reviews.map((item: any) => [Number(item.id), item]));

    return lots.map((lot: any) => {
      const reviewId = Number(lot.revisionProduccionId?.id ?? lot.revisionProduccionId);
      const review = reviewMap.get(reviewId) ?? null;
      const candidate = candidates.find(
        (item: any) => Number(item.id) === Number(review?.assignment?.asignacionOrdenCuadrillaId),
      );

      return {
        ...lot,
        estado: normalizeState(lot.estado),
        review,
        asignacionOrdenCuadrillaId: candidate?.id ?? null,
        orden: candidate?.orden ?? null,
        cuadrilla: candidate?.cuadrilla ?? null,
        modalidad: candidate?.modalidad ?? null,
        montoTotal: candidate?.montoTotal ?? 0,
        blockers: candidate?.blockers ?? [],
      };
    });
  }

  private async getRawById(id: number) {
    const lot = await this.repo.findOne({
      where: { id, fechaEliminacion: IsNull() } as any,
      relations: { revisionProduccionId: true } as any,
    });

    if (!lot) {
      throw new NotFoundError("Lote de producción no encontrado");
    }

    return lot;
  }

  private async getCandidateOrFail(aocId: number) {
    const candidates = await this.buildCandidates();
    const candidate = candidates.find((item: any) => Number(item.id) === Number(aocId));
    if (!candidate) {
      throw new NotFoundError("La asignación de orden a cuadrilla no existe.");
    }
    return candidate;
  }

  private async generateNumeroLote(cuadrillaId: number) {
    const lots = await this.repo.findAll({ where: { fechaEliminacion: IsNull() } as any });
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const prefix = `LOTE-${y}${m}${d}-C${cuadrillaId}-`;
    const consecutive = lots.filter((item: any) => String(item.numeroLote).startsWith(prefix)).length + 1;
    return `${prefix}${String(consecutive).padStart(2, "0")}`;
  }

  async getCandidates() {
    return this.buildCandidates();
  }

  async generate(dto: CreateProductionLotDtoType) {
    if (!dto.asignacionOrdenCuadrillaId) {
      throw new BadRequestError("Debes indicar la asignación de orden a cuadrilla.");
    }

    const candidate = await this.getCandidateOrFail(dto.asignacionOrdenCuadrillaId);
    if (candidate.modalidad !== "DESTAJO") {
      throw new BadRequestError("No se puede generar lote para órdenes PAGO_POR_DIAS.");
    }
    if (!candidate.canGenerate) {
      throw new BadRequestError(candidate.blockers.join(" "));
    }

    const representativeReview = candidate.approvedReviews[0];
    if (!representativeReview) {
      throw new BadRequestError("No existe una revisión aprobada para vincular el lote.");
    }

    const numeroLote = dto.numeroLote?.trim() || (await this.generateNumeroLote(candidate.cuadrilla?.id ?? 0));

    const saved = await this.repo.save(
      this.repo.create({
        numeroLote,
        totalPiezasAprobadas: candidate.totalAprobado,
        fechaEnvio: dto.fechaEnvio ?? new Date(),
        estado: normalizeState(dto.estado ?? "ACTIVO"),
        revisionProduccionId: { id: representativeReview.id } as any,
      }),
    );

    if (candidate.orden) {
      const enrichedLots = await this.enrichLots();
      const totalLoteOrden = enrichedLots
        .filter((item: any) => Number(item.orden?.id) === Number(candidate.orden?.id))
        .reduce((acc: number, item: any) => acc + Number(item.totalPiezasAprobadas ?? 0), 0);

      if (totalLoteOrden >= Number(candidate.orden.cantidadRequerida)) {
        await this.ordenRepo.update(candidate.orden.id, { estado: "COMPLETADA" } as any);
      }
    }

    return this.getById(saved.id);
  }

  async getById(id: number) {
    const lots = await this.enrichLots();
    const lot = lots.find((item: any) => Number(item.id) === Number(id));
    if (!lot) {
      throw new NotFoundError("Lote de producción no encontrado");
    }
    return lot;
  }

  async create(dto: CreateProductionLotDtoType) {
    if (dto.asignacionOrdenCuadrillaId) {
      return this.generate(dto);
    }

    if (!dto.revisionProduccionId || dto.totalPiezasAprobadas == null || !dto.numeroLote) {
      throw new BadRequestError("Faltan datos para crear el lote manualmente.");
    }

    const review = await this.reviewService.getById(dto.revisionProduccionId);
    if (normalizeState((review as any).assignment?.orden?.modalidad ?? (review as any).assignment?.modalidad) !== "DESTAJO") {
      throw new BadRequestError("No se puede crear lote manual para una orden PAGO_POR_DIAS.");
    }

    const newLot = this.repo.create({
      numeroLote: dto.numeroLote,
      totalPiezasAprobadas: dto.totalPiezasAprobadas,
      fechaEnvio: dto.fechaEnvio ?? new Date(),
      estado: normalizeState(dto.estado ?? "ACTIVO"),
      revisionProduccionId: { id: dto.revisionProduccionId } as any,
    });

    const saved = await this.repo.save(newLot);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateProductionLotDtoType) {
    await this.getRawById(id);

    if (dto.totalPiezasAprobadas != null && dto.revisionProduccionId != null) {
      const review = await this.reviewService.getById(dto.revisionProduccionId);
      if (dto.totalPiezasAprobadas > Number(review.cantidadAprobada ?? 0)) {
        throw new BadRequestError("La cantidad del lote no puede superar lo aprobado en la revisión vinculada.");
      }
    }

    await this.repo.update(id, {
      ...(dto.numeroLote !== undefined && { numeroLote: dto.numeroLote }),
      ...(dto.totalPiezasAprobadas !== undefined && { totalPiezasAprobadas: dto.totalPiezasAprobadas }),
      ...(dto.fechaEnvio !== undefined && { fechaEnvio: dto.fechaEnvio }),
      ...(dto.estado !== undefined && { estado: normalizeState(dto.estado) }),
      ...(dto.revisionProduccionId !== undefined && { revisionProduccionId: { id: dto.revisionProduccionId } as any }),
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getRawById(id);
    return this.repo.update(id, { fechaEliminacion: new Date() } as any);
  }

  async getAll() {
    return this.enrichLots();
  }
}
