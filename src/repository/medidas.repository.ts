import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { Medidas } from "../entity/medidas.entity"; 

export class MedidaRepository extends BaseRepository<Medidas> {
  constructor() {
    super(AppDataSource.getRepository(Medidas)); 
  }

  findByNombre(nombre: string) {
    return this.repo.findOne({ where: { nombre } });
  }
}