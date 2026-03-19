import { IsNull } from "typeorm";
import { NotFoundError } from "../../error/customErrors";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import {
  CreateProductionLotDtoType,
  UpdateProductionLotDtoType,
} from "./productionLot.dto";

export class ProductionLotService {
  private readonly repo = new LoteProduccionRepository();

  async getById(id: number) {
    const lote = await this.repo.findOne({
      where: {
        id,
        fechaEliminacion: IsNull(),
      },
    });

    if (!lote) throw new NotFoundError("Lote de producción no encontrado");
    return lote;
  }

  async create(dto: CreateProductionLotDtoType) {
    const newLot = this.repo.create({
      numeroLote: dto.numeroLote,
      totalPiezasAprobadas: dto.totalPiezasAprobadas,
      fechaEnvio: dto.fechaEnvio,
      estado: dto.estado,
      revisionProduccionId: dto.revisionProduccionId,
    });

    return await this.repo.save(newLot);
  }

  async update(id: number, dto: UpdateProductionLotDtoType) {
    await this.getById(id);

    return this.repo.update(id, {
      ...(dto.numeroLote !== undefined && { numeroLote: dto.numeroLote }),
      ...(dto.totalPiezasAprobadas !== undefined && {
        totalPiezasAprobadas: dto.totalPiezasAprobadas,
      }),
      ...(dto.fechaEnvio !== undefined && { fechaEnvio: dto.fechaEnvio }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.revisionProduccionId !== undefined && {
        revisionProduccionId: dto.revisionProduccionId,
      }),
    });
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
    });
  }
}