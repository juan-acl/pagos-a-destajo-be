import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity("PRD_MEDIDAS")
export class MedidaEntity extends BaseEntity {
  @Column({ type: "varchar", length: 100, nullable: false, name: "MED_nombre" })
  nombre: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "MED_iniciales" })
  iniciales: string;
}
