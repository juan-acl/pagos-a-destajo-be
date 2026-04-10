import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { CuadrillaEntity } from "./cuadrilla.entity";

@Entity("DES_ASIGNACION_EMPLEADO")
export class AsignacionEmpleado {
  @PrimaryGeneratedColumn({
    name: "ASE_ID",
    type: "number",
  })
  id!: number;

  @Column({
    name: "ASE_META_INDIVIDUAL",
    type: "number",
    nullable: false,
  })
  metaIndividual!: number;

  @Column({
    name: "ASE_ESTADO",
    type: "varchar2",
    length: 50,
    nullable: false,
  })
  estado!: string;

  @Column({
    name: "ASE_FECHA_CREACION",
    type: "timestamp",
  })
  fecha_creacion!: Date;

  @Column({
    name: "ASE_FECHA_ACTUALIZACION",
    type: "timestamp",
  })
  fecha_actualizacion!: Date;

  @Column({
    name: "ASE_FECHA_ELIMINACION",
    type: "timestamp",
    nullable: true,
  })
  fecha_eliminacion!: Date | null;

  @ManyToOne(() => CuadrillaEntity, { nullable: true })
  @JoinColumn({ name: "ASE_CUADRILLA_ID" })
  cuadrillaId!: CuadrillaEntity;
}
