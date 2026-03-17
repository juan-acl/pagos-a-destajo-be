import { NotFoundError } from "../../error/customErrors";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { CreateMiembroDtoType, UpdateMiembroDtoType } from "./miembro-cuadrilla.dto";

export class MiembroCuadrillaService {
    private readonly repo = new MiembroCuadrillaRepository();

    async getAll() {
        return this.repo.findAll({ where: { estado: "ACTIVO" } });
    }

    async getById(id: number) {
        const miembro = await this.repo.findById(id);
        if (!miembro) throw new NotFoundError("Miembro no encontrado");
        return miembro;
    }

    async getByCuadrilla(cuaCuadrillaId: number) {
        return this.repo.findByCuadrilla(cuaCuadrillaId);
    }

    async getByEmpleado(empEmpleadoId: number) {
        return this.repo.findByEmpleado(empEmpleadoId);
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
            ...(dto.empEmpleadoId && { empEmpleadoId: dto.empEmpleadoId }),
            ...(dto.cuaCuadrillaId && { cuaCuadrillaId: dto.cuaCuadrillaId }),
            ...(dto.fechaIngreso && { fechaIngreso: new Date(dto.fechaIngreso) }),
            ...(dto.estado && { estado: dto.estado }),
        });
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.update(id, { estado: "INACTIVO" });
    }
}