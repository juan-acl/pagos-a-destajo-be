import { NotFoundError } from "../../error/customErrors";
import { AreaRepository } from "../../repository/area.repository";
import { CreateAreaDtoType, UpdateAreaDtoType } from "./area.dto";

export class AreaService {
  private readonly repo = new AreaRepository();

  async getById(id: number) {
    const area = await this.repo.findById(id);
    if (!area) throw new NotFoundError("Area no encontrada");
    return area;
  }

  async create(dto: CreateAreaDtoType) {
    const exists = await this.repo.findByName(dto.nombre);
    if (exists) throw new Error("El area ya está registrado");

    const newArea = this.repo.create({
      nombre: dto.nombre,
      codigoArea: dto.codigoArea,
      estado: dto.estado,
    });
    return await this.repo.save(newArea);
  }

  async update(id: number, dto: UpdateAreaDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.codigoArea && { codigoArea: dto.codigoArea }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, {
      estado: "INACTIVO"
    })
  }

  getAll() { 
    return this.repo.findAll({
      where: {
        estado: "ACTIVO"
      }
    })
  }

}
