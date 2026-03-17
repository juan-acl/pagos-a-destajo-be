import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { CreateMiembroDtoType, UpdateMiembroDtoType } from "./miembro-cuadrilla.dto";

export class MiembroCuadrillaService {
    private readonly repo = new MiembroCuadrillaRepository();

    async getAll() {
        return this.repo.findAll();
    }

    async getById(id: number) {
        const miembro = await this.repo.findById(id);
        if (!miembro) throw new Error("Miembro no encontrado");
        return miembro;
    }

    async getByCuadrilla(cuadrillaId: number) {
        return this.repo.findByCuadrilla(cuadrillaId);
    }

    async create(dto: CreateMiembroDtoType) {
        const nuevo = this.repo.create({
            ...dto,
            fechaIngreso: dto.fechaIngreso ? new Date(dto.fechaIngreso) : null,
        });
        return this.repo.save(nuevo);
    }

    async update(id: number, dto: UpdateMiembroDtoType) {
        await this.getById(id);
        return this.repo.update(id, {
            ...dto,
            ...(dto.fechaIngreso && { fechaIngreso: new Date(dto.fechaIngreso) }),
        });
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.delete(id);
    }
}