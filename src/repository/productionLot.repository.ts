import { AppDataSource } from "../config/data-source";
import { LoteProduccion } from "../entity/loteProduccion.entity";
import { BaseRepository } from "../shared/base.repository";

export class LoteProduccionRepository extends BaseRepository<LoteProduccion> {
  constructor() {
    super(AppDataSource.getRepository(LoteProduccion));
  }
}