import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { OrdenTrabajo } from "../entity/ordenTrabajo.entity";

export class OrdenTrabajoRepository extends BaseRepository<OrdenTrabajo> {
  constructor() {
    super(AppDataSource.getRepository(OrdenTrabajo)); // ✅ clase correcta
  }

  findByNumeroOrden(numeroOrden: string) {
    return this.repo.findOne({ where: { numeroOrden } });
  }
}