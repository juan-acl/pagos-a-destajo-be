import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { OrdenTrabajo } from "./ordenTrabajo.entity";
import { Cuadrilla } from "./cuadrilla.entity";

@Entity()
export class AsignacionOrdenCuadrilla {
  @PrimaryGeneratedColumn({ name: "AOC_ID" })
  id: number;

  @ManyToOne(() => OrdenTrabajo, { nullable: true })
  @JoinColumn({ name: "AOC_ORDEN_TRABAJO_ID" })
  ordenTrabajo: OrdenTrabajo | null;

  @ManyToOne(() => Cuadrilla, { nullable: false })
  @JoinColumn({ name: "AOC_CUADRILLA_ID" })
  cuadrilla: Cuadrilla;

  @Column({ name: "AOC_CANTIDAD_ASIGNADA", type: "number" })
  cantidadAsignada: number;

  @Column({ name: "AOC_ESTADO", type: "varchar2", length: 50 })
  estado: string;

  @CreateDateColumn({ name: "AOC_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "AOC_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "AOC_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}