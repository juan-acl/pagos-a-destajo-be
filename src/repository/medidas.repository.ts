import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { MedidaEntity } from "../entity/medidas.entity";

export class MedidaRepository extends BaseRepository<MedidaEntity> {
  constructor() {
    super(AppDataSource.getRepository(MedidaEntity));
  }

  findByNombre(nombre: string) {
    return this.repo.findOne({ where: { nombre } });
  }
}
