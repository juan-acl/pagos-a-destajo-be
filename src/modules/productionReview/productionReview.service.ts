import { IsNull } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateProductionReviewDtoType,
  UpdateProductionReviewDtoType,
} from "./productionReview.dto";
import { AsignacionEmpleado } from "../../entity/employeeAssignment.entity";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";

export class ProductionReviewService {
  private readonly repo = new RevisionProduccionRepository();
  private readonly asignacionRepo = new AsignacionEmpleadoRepository();

  async getById(id: number) {
    const revision = await this.repo.findOne({
      where: {
        id,
        fecha_eliminacion: IsNull(),
      } as any,
      relations: {
        asignacionEmpleadoId: {
          cuadrillaId: true,
        },
      } as any,
    });

    if (!revision)
      throw new NotFoundError("Revisión de producción no encontrada");
    return revision;
  }

  async create(dto: CreateProductionReviewDtoType) {
    await this.ensureValidAssignment(dto.asignacionEmpleadoId);
    this.validateQuantities(dto.cantidadRecibida, dto.cantidadAprobada);

    const newReview = this.repo.create({
      cantidadRecibida: dto.cantidadRecibida,
      cantidadAprobada: dto.cantidadAprobada,
      estadoRevision: dto.estadoRevision,
      observaciones: dto.observaciones,
      fechaRevision: dto.fechaRevision,
      asignacionEmpleadoId: { id: dto.asignacionEmpleadoId } as AsignacionEmpleado,
    });

    const saved = await this.repo.save(newReview);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateProductionReviewDtoType) {
    const currentRevision = await this.getById(id);

    const cantidadRecibida = dto.cantidadRecibida ?? currentRevision.cantidadRecibida;
    const cantidadAprobada = dto.cantidadAprobada ?? currentRevision.cantidadAprobada;

    this.validateQuantities(cantidadRecibida, cantidadAprobada);

    if (dto.asignacionEmpleadoId !== undefined) {
      await this.ensureValidAssignment(dto.asignacionEmpleadoId);
      currentRevision.asignacionEmpleadoId = {
        id: dto.asignacionEmpleadoId,
      } as AsignacionEmpleado;
    }

    if (dto.cantidadRecibida !== undefined)
      currentRevision.cantidadRecibida = dto.cantidadRecibida;
    if (dto.cantidadAprobada !== undefined)
      currentRevision.cantidadAprobada = dto.cantidadAprobada;
    if (dto.estadoRevision !== undefined)
      currentRevision.estadoRevision = dto.estadoRevision;
    if (dto.observaciones !== undefined)
      currentRevision.observaciones = dto.observaciones;
    if (dto.fechaRevision !== undefined)
      currentRevision.fechaRevision = dto.fechaRevision;

    await this.repo.save(currentRevision);
    return this.getById(id);
  }

  async remove(id: number) {
    await this.getById(id);

    return this.repo.update(id, {
      fecha_eliminacion: new Date(),
    } as any);
  }

  getAll() {
    return this.repo.findAll({
      relations: {
        asignacionEmpleadoId: {
          cuadrillaId: true,
        },
      } as any,
      where: {
        fecha_eliminacion: IsNull(),
      },
    });
  }

  private validateQuantities(cantidadRecibida: number, cantidadAprobada: number) {
    if (cantidadAprobada > cantidadRecibida) {
      throw new BadRequestError(
        "La cantidad aprobada no puede ser mayor que la cantidad recibida",
      );
    }
  }

  private async ensureValidAssignment(asignacionEmpleadoId: number) {
    const asignacion = await this.asignacionRepo.findById(asignacionEmpleadoId);
    if (!asignacion) {
      throw new NotFoundError("La asignación de empleado indicada no existe");
    }
  }
}
