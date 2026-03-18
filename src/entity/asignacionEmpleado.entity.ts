
import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, DeleteDateColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Cuadrilla } from "./cuadrilla.entity";

@Entity()
export class AsignacionEmpleado {
  @PrimaryGeneratedColumn({ name: "ASE_ID" })
  id: number;

  @ManyToOne(() => Cuadrilla, { nullable: false })
  @JoinColumn({ name: "ASE_CUADRILLA_ID" })
  cuadrilla: Cuadrilla;

  @Column({ name: "ASE_META_INDIVIDUAL", type: "number" })
  metaIndividual: number;

  @Column({ name: "ASE_ESTADO", type: "varchar2", length: 50 })
  estado: string;

  @CreateDateColumn({ name: "ASE_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "ASE_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "ASE_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}