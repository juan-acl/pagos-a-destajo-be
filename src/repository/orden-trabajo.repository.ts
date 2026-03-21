import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";

export class OrdenTrabajoRepository extends BaseRepository<OrdenTrabajoEntity> {
  constructor() {
    super(AppDataSource.getRepository(OrdenTrabajoEntity));
  }

  findByNumeroOrden(numeroOrden: string) {
    return this.repo.findOne({ where: { numeroOrden } });
  }
}
