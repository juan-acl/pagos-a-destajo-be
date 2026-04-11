import { AppDataSource } from "../config/data-source";
import { RevisionProduccion } from "../entity/revisionProduccion.entity";
import { BaseRepository } from "../shared/base.repository";

export class RevisionProduccionRepository extends BaseRepository<RevisionProduccion> {
  constructor() {
    super(AppDataSource.getRepository(RevisionProduccion));
  }
}
