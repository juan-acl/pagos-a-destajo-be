import { LoteProduccion } from "../../entity/productionLot.entity";
import { NotFoundError } from "../../error/customErrors";
import { PlanillaRepository } from "../../repository/pagoPlanilla.repository";
import { CreatePaymentDtoType, UpdatePaymentDtoType } from "./pagoPlanilla.dto";

export class PaymentService {
  private readonly repo = new PlanillaRepository();

  async getById(id: number) {
    const planilla = await this.repo.findOne({
      where: {
        id,
      },
      relations: { loteProduccion: true },
    });
    if (!planilla) throw new NotFoundError("Planilla no encontrada");
    return planilla;
  }

  async create(dto: CreatePaymentDtoType) {
    const newArea = this.repo.create({
      descripcion: dto.descripcion,
      loteProduccion: { id: dto.loteProduccionId },
      metodoPago: dto.metodoPago,
      montoTotal: dto.montoTotal,
      numeroPago: dto.numeroPago,
      estado: dto.estado,
    });
    return await this.repo.save(newArea);
  }

  async update(id: number, dto: UpdatePaymentDtoType) {
    const planilla = await this.getById(id); // debe retornar la entity completa

    if (dto.descripcion) planilla.descripcion = dto.descripcion;
    if (dto.metodoPago) planilla.metodoPago = dto.metodoPago;
    if (dto.montoTotal) planilla.montoTotal = dto.montoTotal;
    if (dto.numeroPago) planilla.numeroPago = dto.numeroPago;
    if (dto.estado) planilla.estado = dto.estado;
    if (dto.loteProduccionId)
      planilla.loteProduccion = { id: dto.loteProduccionId } as LoteProduccion;

    return this.repo.save(planilla);
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
      relations: { loteProduccion: true },
    });
  }
}
