import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";
import { StatusType, zStatus } from "../shared/status";

@Entity()
export class Area extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: false })
  codigoArea: string;

  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ type: "varchar",length: 50, nullable: false, enum: zStatus })
  estado: StatusType;
}
