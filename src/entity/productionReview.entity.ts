import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity()
export class RevisionProduccion extends BaseEntity {
  @Column({ type: "number", nullable: false })
  cantidadRecibida: number;

  @Column({ type: "number", nullable: false })
  cantidadAprobada: number;

  @Column({ type: "varchar2", length: 50, nullable: false })
  estadoRevision: string;

  @Column({ type: "varchar2", length: 255, nullable: true })
  observaciones?: string;

  @Column({ type: "date", nullable: false })
  fechaRevision: Date;

  @Column({ type: "number", nullable: false })
  asignacionEmpleadoId: number;
}
