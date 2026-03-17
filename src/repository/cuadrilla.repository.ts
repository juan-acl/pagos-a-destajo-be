import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { CuadrillaEntity } from "../entity/cuadrilla.entity";

export class CuadrillaRepository extends BaseRepository<CuadrillaEntity> {
    constructor() {
        super(AppDataSource.getRepository(CuadrillaEntity));
    }

    findActivas() {
        return this.repo.find({ where: { estado: "activo" } });
    }
}