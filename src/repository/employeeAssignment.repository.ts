import { AppDataSource } from "../config/data-source";
import { AsignacionEmpleado } from "../entity/asignacionEmpleado.entity";
import { BaseRepository } from "../shared/base.repository";

export class EmployeeAssignmentRepository extends BaseRepository<AsignacionEmpleado> {
  constructor() {
    super(AppDataSource.getRepository(AsignacionEmpleado));
  }
}