import { AppDataSource } from "../config/data-source";
import { Area } from "../entity/area.entity";
import { BaseRepository } from "../shared/base.repository";

export class AreaRepository extends BaseRepository<Area> {
  constructor() {
    super(AppDataSource.getRepository(Area));
  }

  findByName(nombre: string) {
    return this.repo.findOne({
      where: {
        nombre,
      },
    });
  }
}
 