import { IsNull } from "typeorm";
import { NotFoundError } from "../../error/customErrors";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateProductionReviewDtoType,
  UpdateProductionReviewDtoType,
} from "./productionReview.dto";

export class ProductionReviewService {
  private readonly repo = new RevisionProduccionRepository();

  async getById(id: number) {
    const revision = await this.repo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      } as any,
    });

    if (!revision) throw new NotFoundError("Revisión de producción no encontrada");
    return revision;
  }

async create(dto: CreateProductionReviewDtoType) {
  const reportePendiente = await this.repo.findOne({
    where: {
      asignacionEmpleadoId: dto.asignacionEmpleadoId,
      estadoRevision: "PENDIENTE_REVISION",
      deletedAt: IsNull(),
    } as any,
  });
  if (reportePendiente) {
    throw new Error("Ya tienes un reporte pendiente de revisión para esta asignación. Espera a que sea revisado antes de enviar otro.");
  }

  const newReview = this.repo.create({
    cantidadRecibida: dto.cantidadRecibida,
    cantidadAprobada: dto.cantidadAprobada,
    estadoRevision: dto.estadoRevision,
    observaciones: dto.observaciones,
    fechaRevision: dto.fechaRevision,
    asignacionEmpleadoId: dto.asignacionEmpleadoId,
  });

  return await this.repo.save(newReview);
}

  async update(id: number, dto: UpdateProductionReviewDtoType) {
    await this.getById(id);

    return this.repo.update(id, {
      ...(dto.cantidadRecibida !== undefined && { cantidadRecibida: dto.cantidadRecibida }),
      ...(dto.cantidadAprobada !== undefined && { cantidadAprobada: dto.cantidadAprobada }),
      ...(dto.estadoRevision !== undefined && { estadoRevision: dto.estadoRevision }),
      ...(dto.observaciones !== undefined && { observaciones: dto.observaciones }),
      ...(dto.fechaRevision !== undefined && { fechaRevision: dto.fechaRevision }),
      ...(dto.asignacionEmpleadoId !== undefined && { asignacionEmpleadoId: dto.asignacionEmpleadoId }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, { deletedAt: new Date() } as any);
  }

  getAll() {
    return this.repo.findAll({
      where: {
        deletedAt: IsNull(),
      } as any,
    });
  }
}