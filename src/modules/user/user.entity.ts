import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../shared/base.entity";

@Entity("usuarios")
export class UserEntity extends BaseEntity {
  @Column({ type: "varchar", length: 100, nullable: false })
  nombre: string;

  @Column({ type: "varchar", length: 150, nullable: false, unique: true })
  correo: string;

  @Column({ type: "number", name: "id_cuadrilla", nullable: true })
  idCuadrilla: number | null;
}
