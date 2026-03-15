import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity()
export class Puesto extends BaseEntity {
  @Column({ type: "varchar", length: 200, nullable: false })
  nombre: string;

  @Column({ type: "varchar", length: 200, nullable: false, unique: true })
  descripcion: string;

  @Column({ type: "varchar",length: 50, nullable: false, enum: ["ACTIVO", "INACTIVO"] })
  estado: "ACTIVO" | "INACTIVO";
}
