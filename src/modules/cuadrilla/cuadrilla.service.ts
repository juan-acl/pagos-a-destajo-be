import { NotFoundError } from "../../error/customErrors";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { CreateCuadrillaDtoType, UpdateCuadrillaDtoType } from "./cuadrilla.dto";

export class CuadrillaService {
    private readonly repo = new CuadrillaRepository();

    async getAll() {
        return this.repo.findAll({ where: { estado: "ACTIVO" } });
    }

    async getById(id: number) {
        const cuadrilla = await this.repo.findById(id);
        if (!cuadrilla) throw new NotFoundError("Cuadrilla no encontrada");
        return cuadrilla;
    }

    async create(dto: CreateCuadrillaDtoType) {
        const existe = await this.repo.findByName(dto.nombre);
        if (existe) throw new Error("La cuadrilla ya está registrada");
        const nuevo = this.repo.create(dto);
        return this.repo.save(nuevo);
    }

    async update(id: number, dto: UpdateCuadrillaDtoType) {
        await this.getById(id);
        return this.repo.update(id, {
            ...(dto.nombre && { nombre: dto.nombre }),
            ...(dto.codigoCuadrilla && { codigoCuadrilla: dto.codigoCuadrilla }),
            ...(dto.areArea && { areArea: dto.areArea }),
            ...(dto.estado && { estado: dto.estado }),
        });
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.update(id, { estado: "INACTIVO" });
    }
}