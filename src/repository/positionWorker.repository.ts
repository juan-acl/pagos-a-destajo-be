import { AppDataSource } from "../config/data-source";
import { Puesto } from "../entity/puesto.entity";
import { BaseRepository } from "../shared/base.repository";

export class PositionWorkerRepository extends BaseRepository<Puesto> {
  constructor() {
    super(AppDataSource.getRepository(Puesto));
  }

  findByName(nombre: string) {
    return this.repo.findOne({
      where: {
        nombre,
      },
    });
  }
}
