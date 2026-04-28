import { AppDataSource } from "../config/data-source";
import { RegistroDiario } from "../entity/registroDiario.entity";
import { BaseRepository } from "../shared/base.repository";

export class RegistroDiarioRepository extends BaseRepository<RegistroDiario> {
  constructor() {
    super(AppDataSource.getRepository(RegistroDiario));
  }
}
