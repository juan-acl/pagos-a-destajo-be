import { AppDataSource } from "../config/data-source";
import { AsignacionEmpleado } from "../entity/employeeAssignment.entity";
import { BaseRepository } from "../shared/base.repository";

export class AsignacionEmpleadoRepository extends BaseRepository<AsignacionEmpleado> {
  constructor() {
    super(AppDataSource.getRepository(AsignacionEmpleado));
  }
}