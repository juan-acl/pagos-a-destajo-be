import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { CuadrillaEntity } from "../entity/cuadrilla.entity";

export class CuadrillaRepository extends BaseRepository<CuadrillaEntity> {
    constructor() {
        super(AppDataSource.getRepository(CuadrillaEntity));
    }

    findByName(nombre: string) {
        return this.repo.findOne({ where: { nombre } });
    }
}