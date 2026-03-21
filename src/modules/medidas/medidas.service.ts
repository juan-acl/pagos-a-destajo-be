import { CreateMedidaDtoType, UpdateMedidaDtoType } from "./medidas.dto";
import { MedidaRepository } from "../../repository/medidas.repository";

export class MedidaService {
  private readonly repo = new MedidaRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number) {
    const medida = await this.repo.findById(id);
    if (!medida) throw new Error("Medida no encontrada");
    return medida;
  }

  async create(dto: CreateMedidaDtoType) {
    const existe = await this.repo.findByNombre(dto.nombre);
    if (existe) throw new Error("Ya existe una medida con ese nombre");

    const nueva = this.repo.create({
      nombre: dto.nombre,
      iniciales: dto.iniciales,
    });
    return this.repo.save(nueva);
  }

  async update(id: number, dto: UpdateMedidaDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.iniciales && { iniciales: dto.iniciales }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
