import { AppDataSource } from "../../config/data-source";
import { BaseRepository } from "../../shared/base.repository";
import { UserEntity } from "./user.entity";

export class UserRepository extends BaseRepository<UserEntity> {
  constructor() {
    super(AppDataSource.getRepository(UserEntity));
  }

  findByEmail(correo: string) {
    return this.repo.findOne({
      where: {
        correo,
      },
    });
  }
}
