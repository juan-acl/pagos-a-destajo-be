import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { EmpleadoEntity } from "../entity/empleado.entity";

export class EmpleadoRepository extends BaseRepository<EmpleadoEntity> {
    constructor() {
        super(AppDataSource.getRepository(EmpleadoEntity));
    }

    findByEmail(email: string) {
        return this.repo.findOne({ where: { email } });
    }

    findActivos() {
        return this.repo.find({ where: { estado: "activo" } });
    }
}