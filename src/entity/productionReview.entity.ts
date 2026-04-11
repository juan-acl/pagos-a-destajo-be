import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  RelationId,
} from "typeorm";
import { AsignacionEmpleado } from "./employeeAssignment.entity";

@Entity("DES_REVISION_PRODUCCION")
export class RevisionProduccion {
  @PrimaryGeneratedColumn({
    name: "RVP_ID",
    type: "number",
  })
  id!: number;

  @Column({
    name: "RVP_CANTIDAD_RECIBIDA",
    type: "number",
    nullable: false,
  })
  cantidadRecibida!: number;

  @Column({
    name: "RVP_CANTIDAD_APROBADA",
    type: "number",
    nullable: false,
  })
  cantidadAprobada!: number;

  @Column({
    name: "RVP_ESTADO_REVISION",
    type: "varchar2",
    length: 50,
    nullable: false,
  })
  estadoRevision!: string;

  @Column({ name: "RVP_OBSERVACIONES", type: "varchar2", length: 255, nullable: true })
  observaciones?: string;

  @Column({
    name: "RVP_OBSERVACIONES",
    type: "varchar2",
    length: 255,
    nullable: true,
  })
  observaciones?: string;

  @Column({
    name: "RVP_FECHA_REVISION",
    type: "date",
    nullable: false,
  })
  fechaRevision!: Date;

  @ManyToOne(() => AsignacionEmpleado, { nullable: true })
  @JoinColumn({ name: "RVP_ASIGNACION_EMPLEADO_ID" })
  asignacion!: AsignacionEmpleado | null;

  @RelationId((revision: RevisionProduccion) => revision.asignacion)
  asignacionEmpleadoId!: number | null;

  @CreateDateColumn({
    name: "RVP_FECHA_CREACION",
    type: "timestamp",
  })
  fecha_creacion!: Date;

  @UpdateDateColumn({
    name: "RVP_FECHA_ACTUALIZACION",
    type: "timestamp",
  })
  fecha_actualizacion!: Date;

  @DeleteDateColumn({
    name: "RVP_FECHA_ELIMINACION",
    type: "timestamp",
    nullable: true,
  })
  fecha_eliminacion!: Date | null;
}