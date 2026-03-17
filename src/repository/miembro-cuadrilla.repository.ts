import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { MiembroCuadrillaEntity } from "../entity/miembro-cuadrilla.entity";

export class MiembroCuadrillaRepository extends BaseRepository<MiembroCuadrillaEntity> {
    constructor() {
        super(AppDataSource.getRepository(MiembroCuadrillaEntity));
    }

    findByCuadrilla(cuaCuadrillaId: number) {
        return this.repo.find({
            where: { cuaCuadrillaId },
            relations: ["empEmpleado", "cuaCuadrilla"],
        });
    }

    findByEmpleado(empEmpleadoId: number) {
        return this.repo.find({
            where: { empEmpleadoId },
            relations: ["empEmpleado", "cuaCuadrilla"],
        });
    }
}