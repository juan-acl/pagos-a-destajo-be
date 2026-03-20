import {
  CreatePositionWorkerDtoType,
  UpdatePositionWorkerDtoType,
} from "./positionWorker.dto";
import { PositionWorkerRepository } from "../../repository/positionWorker.repository";
import { NotFoundError } from "../../error/customErrors";

export class PositionWorkerService {
  private readonly repo = new PositionWorkerRepository();

  async getById(id: number) {
    const usuario = await this.repo.findById(id);
    if (!usuario) throw new NotFoundError("Usuario no encontrado");
    return usuario;
  }

  async create(dto: CreatePositionWorkerDtoType) {
    const existe = await this.repo.findByName(dto.nombre);
    if (existe) throw new Error("El correo ya está registrado");

    const nuevo = this.repo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      estado: dto.estado,
    });
    return await this.repo.save(nuevo);
  }

  async update(id: number, dto: UpdatePositionWorkerDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.descripcion && { descripcion: dto.descripcion }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, {
      estado: "INACTIVO",
      fechaEliminacion: new Date(),
    });
  }

  getAll() {
    return this.repo.findAll({
      where: {
        estado: "ACTIVO",
      },
    });
  }
}
