import { AppDataSource } from "../config/data-source";
import { Planilla } from "../entity/pagoPlanilla.entity";
import { BaseRepository } from "../shared/base.repository";

export class PlanillaRepository extends BaseRepository<Planilla> {
  constructor() {
    super(AppDataSource.getRepository(Planilla));
  }
}
 