import { CreateAsignacionOrdenCuadrillaDtoType, UpdateAsignacionOrdenCuadrillaDtoType } from "./asignacion-orden-cuadrilla.dto";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";

export class AsignacionOrdenCuadrillaService {
  private readonly repo = new AsignacionOrdenCuadrillaRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number) {
    const asignacion = await this.repo.findById(id);
    if (!asignacion) throw new Error("Asignación no encontrada");
    return asignacion;
  }

  async create(dto: CreateAsignacionOrdenCuadrillaDtoType) {
    const existe = await this.repo.findByOrdenYCuadrilla(dto.ordenTrabajoId, dto.cuadrillaId);
    if (existe) throw new Error("Ya existe una asignación para esa orden y cuadrilla");

    const nueva = this.repo.create({
      ordenTrabajoId: dto.ordenTrabajoId,
      cuadrillaId: dto.cuadrillaId,
      cantidadAsignada: dto.cantidadAsignada,
      estado: dto.estado ?? "activo",
    });
    return this.repo.save(nueva);
  }

  async update(id: number, dto: UpdateAsignacionOrdenCuadrillaDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.ordenTrabajoId && { ordenTrabajoId: dto.ordenTrabajoId }),
      ...(dto.cuadrillaId && { cuadrillaId: dto.cuadrillaId }),
      ...(dto.cantidadAsignada && { cantidadAsignada: dto.cantidadAsignada }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
