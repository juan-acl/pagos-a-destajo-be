import { CreateOrdenTrabajoDtoType, UpdateOrdenTrabajoDtoType } from "./orden-trabajo.dto";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";

export class OrdenTrabajoService {
  private readonly repo = new OrdenTrabajoRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number) {
    const orden = await this.repo.findById(id);
    if (!orden) throw new Error("Orden de trabajo no encontrada");
    return orden;
  }

  async create(dto: CreateOrdenTrabajoDtoType) {
    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, "");
    const ordenes = await this.repo.findAll();
    const correlativo = String(ordenes.length + 1).padStart(3, "0");
    const numeroOrden = `ORD-${fechaStr}-${correlativo}`;

    const nueva = this.repo.create({
      numeroOrden,
      cantidadRequerida: dto.cantidadRequerida,
      medidaId: dto.medidaId ?? null,
      pagoUnitario: dto.pagoUnitario,
      fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : null,
      estado: dto.estado ?? "activo",
    });
    return this.repo.save(nueva);
  }

  async update(id: number, dto: UpdateOrdenTrabajoDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.numeroOrden && { numeroOrden: dto.numeroOrden }),
      ...(dto.cantidadRequerida && { cantidadRequerida: dto.cantidadRequerida }),
      ...(dto.medidaId && { medidaId: dto.medidaId }),
      ...(dto.pagoUnitario && { pagoUnitario: dto.pagoUnitario }),
      ...(dto.fechaLimite && { fechaLimite: new Date(dto.fechaLimite) }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
