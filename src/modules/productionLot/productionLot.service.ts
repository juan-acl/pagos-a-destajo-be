import { IsNull } from "typeorm";
import { NotFoundError } from "../../error/customErrors";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  CreateProductionLotDtoType,
  UpdateProductionLotDtoType,
} from "./productionLot.dto";

export class ProductionLotService {
  private readonly repo = new LoteProduccionRepository();
  private readonly revisionRepo = new RevisionProduccionRepository();

  async getById(id: number) {
    const lote = await this.repo.findOne({
      where: {
        id,
        fechaEliminacion: IsNull(),
      },
      relations: {
        revisionProduccionId: {
          asignacionEmpleadoId: true,
        },
      } as any,
    });

    if (!lote) throw new NotFoundError("Lote de producción no encontrado");
    return lote;
  }

  async create(dto: CreateProductionLotDtoType) {
    if (dto.revisionProduccionId !== undefined) {
      await this.ensureValidRevision(dto.revisionProduccionId);
    }

    const newLot = this.repo.create({
      numeroLote: dto.numeroLote,
      totalPiezasAprobadas: dto.totalPiezasAprobadas,
      fechaEnvio: dto.fechaEnvio,
      estado: dto.estado,
      revisionProduccionId:
        dto.revisionProduccionId !== undefined
          ? ({ id: dto.revisionProduccionId } as any)
          : undefined,
    });

    const saved = await this.repo.save(newLot);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateProductionLotDtoType) {
    await this.getById(id);

    if (dto.revisionProduccionId !== undefined) {
      await this.ensureValidRevision(dto.revisionProduccionId);
    }

    await this.repo.update(id, {
      ...(dto.numeroLote !== undefined && { numeroLote: dto.numeroLote }),
      ...(dto.totalPiezasAprobadas !== undefined && {
        totalPiezasAprobadas: dto.totalPiezasAprobadas,
      }),
      ...(dto.fechaEnvio !== undefined && { fechaEnvio: dto.fechaEnvio }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.revisionProduccionId !== undefined && {
        revisionProduccionId: { id: dto.revisionProduccionId } as any,
      }),
    });

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getById(id);

    return this.repo.update(id, {
      fechaEliminacion: new Date(),
    });
  }

  getAll() {
    return this.repo.findAll({
      where: {
        fechaEliminacion: IsNull(),
      },
      relations: {
        revisionProduccionId: {
          asignacionEmpleadoId: true,
        },
      } as any,
    });
  }

  private async ensureValidRevision(revisionProduccionId: number) {
    const revision = await this.revisionRepo.findById(revisionProduccionId);

    if (!revision) {
      throw new NotFoundError("La revisión de producción indicada no existe");
    }
  }
}
