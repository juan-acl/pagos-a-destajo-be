import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { MiembroCuadrillaEntity } from "../entity/miembro-cuadrilla.entity";

export class MiembroCuadrillaRepository extends BaseRepository<MiembroCuadrillaEntity> {
    constructor() {
        super(AppDataSource.getRepository(MiembroCuadrillaEntity));
    }

    findAll() {
        return this.repo.find({
            where: { estado: "ACTIVO" },
            relations: ["empleado", "cuadrilla"],
        });
    }

    findByCuadrilla(cuadrillaId: number) {
        return this.repo.find({
            where: { cuadrillaId, estado: "ACTIVO" },
            relations: ["empleado", "cuadrilla"],
        });
    }

    findByEmpleado(empleadoId: number) {
        return this.repo.find({
            where: { empleadoId, estado: "ACTIVO" },
            relations: ["empleado", "cuadrilla"],
        });
    }
}