import { NotFoundError } from "../../error/customErrors";
import { EmpleadoRepository } from "../../repository/empleado.repository";
import { CreateEmpleadoDtoType, UpdateEmpleadoDtoType } from "./empleado.dto";

export class EmpleadoService {
    private readonly repo = new EmpleadoRepository();

    async getAll() {
        return this.repo.findAll({ where: { estado: "ACTIVO" } });
    }

    async getById(id: number) {
        const empleado = await this.repo.findById(id);
        if (!empleado) throw new NotFoundError("Empleado no encontrado");
        return empleado;
    }

    async create(dto: CreateEmpleadoDtoType) {
        const existe = await this.repo.findByEmail(dto.email);
        if (existe) throw new Error("El email ya está registrado");
        const nuevo = this.repo.create(dto);
        return this.repo.save(nuevo);
    }

    async update(id: number, dto: UpdateEmpleadoDtoType) {
        await this.getById(id);
        return this.repo.update(id, {
            ...(dto.primerNombre && { primerNombre: dto.primerNombre }),
            ...(dto.segundoNombre && { segundoNombre: dto.segundoNombre }),
            ...(dto.primerApellido && { primerApellido: dto.primerApellido }),
            ...(dto.segundoApellido && { segundoApellido: dto.segundoApellido }),
            ...(dto.email && { email: dto.email }),
            ...(dto.codigoEmpleado && { codigoEmpleado: dto.codigoEmpleado }),
            ...(dto.pstPuesto && { pstPuesto: dto.pstPuesto }),
            ...(dto.estado && { estado: dto.estado }),
        });
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.update(id, { estado: "INACTIVO" });
    }
}