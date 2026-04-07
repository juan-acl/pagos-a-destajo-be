import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { AsignacionOrdenCuadrillaEntity } from "../entity/asignacion-orden-cuadrilla.entity";

export class AsignacionOrdenCuadrillaRepository extends BaseRepository<AsignacionOrdenCuadrillaEntity> {
  constructor() {
    super(AppDataSource.getRepository(AsignacionOrdenCuadrillaEntity));
  }

  findByOrdenYCuadrilla(ordenTrabajoId: number, cuadrillaId: number) {
    return this.repo.findOne({ where: { ordenTrabajoId, cuadrillaId } });
  }

  findByOrden(ordenTrabajoId: number) {
    return this.repo.find({ where: { ordenTrabajoId } });
  }

  findByCuadrilla(cuadrillaId: number) {
    return this.repo.find({ where: { cuadrillaId } });
  }
}
