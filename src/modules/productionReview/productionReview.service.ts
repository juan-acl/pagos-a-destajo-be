import { IsNull } from "typeorm";
import { NotFoundError } from "../../error/customErrors";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateProductionReviewDtoType,
  UpdateProductionReviewDtoType,
} from "./productionReview.dto";
import { AsignacionEmpleado } from "../../entity/employeeAssignment.entity";

export class ProductionReviewService {
  private readonly repo = new RevisionProduccionRepository();

  async getById(id: number) {
    const revision = await this.repo.findOne({
      where: {
        id,
        fecha_eliminacion: IsNull(),
      } as any,
    });

    if (!revision)
      throw new NotFoundError("Revisión de producción no encontrada");
    return revision;
  }

  async create(dto: CreateProductionReviewDtoType) {
    const newReview = this.repo.create({
      cantidadRecibida: dto.cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada,
      estadoRevision: dto.estadoRevision,
      observaciones: dto.observaciones,
      fechaRevision: dto.fechaRevision,
      asignacionEmpleadoId: { id: dto.asignacionEmpleadoId },
    });

    return await this.repo.save(newReview);
  }

  async update(id: number, dto: UpdateProductionReviewDtoType) {
    const currentRevision = await this.getById(id);

    if (dto.asignacionEmpleadoId)
      currentRevision.asignacionEmpleadoId = {
        id: dto.asignacionEmpleadoId,
      } as AsignacionEmpleado;
    if (dto.cantidadRecibida)
      currentRevision.cantidadRecibida = dto.cantidadRecibida;
    if (dto.cantidadAprobada)
      currentRevision.cantidadAprobada = dto.cantidadAprobada;
    if (dto.estadoRevision) currentRevision.estadoRevision = dto.estadoRevision;
    if (dto.observaciones) currentRevision.observaciones = dto.observaciones;
    if (dto.fechaRevision) currentRevision.fechaRevision = dto.fechaRevision;
    currentRevision.fecha_eliminacion = null;

    return this.repo.save(currentRevision);
  }

  async remove(id: number) {
    await this.getById(id);

    return this.repo.update(id, {
      fecha_eliminacion: new Date(),
    } as any);
  }

  getAll() {
    return this.repo.findAll({
      relations: { asignacionEmpleadoId: true },
      where: {
        fecha_eliminacion: IsNull(),
      },
    });
  }
}
