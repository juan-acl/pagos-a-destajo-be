import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { MiembroCuadrilla } from "../entity/miembro.entity";

export class MiembroCuadrillaRepository extends BaseRepository<MiembroCuadrilla> {
  constructor() {
    super(AppDataSource.getRepository(MiembroCuadrilla));
  }

  findAll() {
    return this.repo.find({
      where: { estado: "ACTIVO" },
      relations: ["empleado", "cuadrilla"],
    });
  }
}