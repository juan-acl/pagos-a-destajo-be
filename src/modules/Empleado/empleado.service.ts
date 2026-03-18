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
        const nuevo = this.repo.create({
            primerNombre: dto.primerNombre,
            segundoNombre: dto.segundoNombre ?? null,
            primerApellido: dto.primerApellido,
            segundoApellido: dto.segundoApellido ?? null,
            email: dto.email,
            password: dto.password,
            codigoEmpleado: dto.codigoEmpleado ?? null,
            pstPuesto: dto.pstPuesto ?? null,
            estado: dto.estado ?? "ACTIVO",
        });
        return this.repo.save(nuevo);
    }

    async update(id: number, dto: UpdateEmpleadoDtoType) {
        await this.getById(id);
        return this.repo.update(id, {
            ...(dto.primerNombre !== undefined && { primerNombre: dto.primerNombre }),
            ...(dto.segundoNombre !== undefined && { segundoNombre: dto.segundoNombre }),
            ...(dto.primerApellido !== undefined && { primerApellido: dto.primerApellido }),
            ...(dto.segundoApellido !== undefined && { segundoApellido: dto.segundoApellido }),
            ...(dto.email !== undefined && { email: dto.email }),
            ...(dto.password !== undefined && dto.password !== "" && { password: dto.password }),
            ...(dto.codigoEmpleado !== undefined && { codigoEmpleado: dto.codigoEmpleado }),
            ...(dto.pstPuesto !== undefined && { pstPuesto: dto.pstPuesto }),
            ...(dto.estado !== undefined && { estado: dto.estado }),
        });
    }

    async remove(id: number) {
        await this.getById(id);
        return this.repo.update(id, { estado: "INACTIVO" });
    }
}