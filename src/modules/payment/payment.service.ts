import { NotFoundError } from "../../error/customErrors";
import { PlanillaRepository } from "../../repository/payment.repository";
import { CreatePaymentDtoType, UpdatePaymentDtoType } from "./payment.dto";

export class PaymentService {
  private readonly repo = new PlanillaRepository();

  async getById(id: number) {
    const planilla = await this.repo.findOne({
        where: {
            id,
        },
        relations: {
            // lote: true
        }
    });
    if (!planilla) throw new NotFoundError("Planilla no encontrada");
    return planilla;
  }

  async create(dto: CreatePaymentDtoType) {

    const newArea = this.repo.create({
        descripcion: dto.descripcion,
        loteProduccionId: dto.loteProduccionId,
        metodoPago: dto.metodoPago,
        montoTotal: dto.montoTotal,
        numeroPago: dto.numeroPago,
        estado: dto.estado,
    });
    return await this.repo.save(newArea);
  }

  async update(id: number, dto: UpdatePaymentDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.descripcion && { descripcion: dto.descripcion }),
      ...(dto.loteProduccionId && { loteProduccionId: dto.loteProduccionId }),
      ...(dto.metodoPago && { metodoPago: dto.metodoPago }),
      ...(dto.montoTotal && { montoTotal: dto.montoTotal }),
      ...(dto.numeroPago && { numeroPago: dto.numeroPago }),
      ...(dto.estado && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, {
      estado: "RECHAZADO"
    })
  }

  getAll() { 
    return this.repo.findAll({})
  }

}
