import { CreateUserDtoType, UpdateUserDtoType } from "./user.dto";
import { UserRepository } from "../../repository/user.repository";

export class UserService {
  private readonly repo = new UserRepository();

  async getById(id: number) {
    const usuario = await this.repo.findById(id);
    if (!usuario) throw new Error("Usuario no encontrado");
    return usuario;
  }

  async create(dto: CreateUserDtoType) {
    const existe = await this.repo.findByEmail(dto.correo);
    if (existe) throw new Error("El correo ya está registrado");

    const nuevo = this.repo.create({
      nombre: dto.nombre,
      correo: dto.correo,
      idCuadrilla: dto.idCuadrilla ?? null,
    });
    return this.repo.save(nuevo);
  }

  async update(id: number, dto: UpdateUserDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.nombre && { nombre: dto.nombre }),
      ...(dto.correo && { correo: dto.correo }),
      ...(dto.idCuadrilla && { idCuadrilla: dto.idCuadrilla }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.delete(id);
  }
}
