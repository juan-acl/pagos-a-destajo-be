import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { CreateCuadrillaDtoType, UpdateCuadrillaDtoType } from "./cuadrilla.dto";

export class CuadrillaService {
    private readonly repo = new CuadrillaRepository();

    async getAll() {
        return this.repo.findAll();
    }

    async getById(id: number) {
        const cuadrilla = await this.repo.findById(id);
        if (!cuadrilla) throw new Error("Cuadrilla no encontrada");
        return cuadrilla;
    }

    async create(dto: CreateCuadrillaDtoType) {
        const nuevo = this.repo.create(dto);
        return this.repo.save(nuevo);
    }

    async update(id: number, dto: UpdateCuadrillaDtoType) {
        await this.getById(id);
        return this.repo.update(id, dto);
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.delete(id);
    }
}