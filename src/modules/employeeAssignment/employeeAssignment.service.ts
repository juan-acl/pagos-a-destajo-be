import { IsNull } from "typeorm";
import { NotFoundError } from "../../error/customErrors";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import {
  CreateEmployeeAssignmentDtoType,
  UpdateEmployeeAssignmentDtoType,
} from "./employeeAssignment.dto";

export class EmployeeAssignmentService {
  private readonly repo = new AsignacionEmpleadoRepository();

  async getById(id: number) {
    const asignacion = await this.repo.findOne({
      where: {
        id,
        fecha_eliminacion: IsNull(),
      } as any,
    });

    if (!asignacion) throw new NotFoundError("Asignación de empleado no encontrada");
    return asignacion;
  }

  async create(dto: CreateEmployeeAssignmentDtoType) {
    const newAssignment = this.repo.create({
      metaIndividual: dto.metaIndividual,
      estado: dto.estado,
      cuadrillaId: dto.cuadrillaId,
    });

    return await this.repo.save(newAssignment);
  }

  async update(id: number, dto: UpdateEmployeeAssignmentDtoType) {
    await this.getById(id);

    return this.repo.update(id, {
      ...(dto.metaIndividual !== undefined && { metaIndividual: dto.metaIndividual }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.cuadrillaId !== undefined && { cuadrillaId: dto.cuadrillaId }),
    });
  }

  async remove(id: number) {
    await this.getById(id);

    return this.repo.update(id, {
      fecha_eliminacion: new Date(),
    } as any);
  }

  getAll() {
    return this.repo.findAll({
      where: {
        fecha_eliminacion: IsNull(),
      } as any,
    });
  }
}
