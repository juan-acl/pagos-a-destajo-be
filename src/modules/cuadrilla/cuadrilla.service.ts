import { NotFoundError } from "../../error/customErrors";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { CreateCuadrillaDtoType, UpdateCuadrillaDtoType } from "./cuadrilla.dto";

export class CuadrillaService {
  private readonly repo = new CuadrillaRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number) {
    const cuadrilla = await this.repo.findById(id);
    if (!cuadrilla) throw new NotFoundError("Cuadrilla no encontrada");
    return cuadrilla;
  }

  async create(dto: CreateCuadrillaDtoType) {
    const existe = await this.repo.findByName(dto.nombre);
    if (existe) throw new Error("La cuadrilla ya está registrada");

    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, "");
    const cuadrillas = await this.repo.findAll();
    const correlativo = String(cuadrillas.length + 1).padStart(3, "0");
    const codigoCuadrilla = `CUA-${fechaStr}-${correlativo}`;

    const nuevo = this.repo.create({
      nombre: dto.nombre,
      codigoCuadrilla,
      areaId: dto.areaId ?? null,
      estado: dto.estado ?? "ACTIVO",
    });
    return this.repo.save(nuevo);
  }

  async update(id: number, dto: UpdateCuadrillaDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.areaId && { areaId: dto.areaId }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, { estado: "INACTIVO" });
  }
}