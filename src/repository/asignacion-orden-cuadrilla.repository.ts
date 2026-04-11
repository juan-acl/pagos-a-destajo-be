import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { AsignacionOrdenCuadrilla } from "../entity/asignacionCuadrilla.entity"; 

export class AsignacionOrdenCuadrillaRepository extends BaseRepository<AsignacionOrdenCuadrilla> {
  constructor() {
    super(AppDataSource.getRepository(AsignacionOrdenCuadrilla)); 
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