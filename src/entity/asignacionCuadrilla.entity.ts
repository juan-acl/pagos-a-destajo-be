import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { OrdenTrabajoEntity } from "./orden-trabajo.entity";
import { CuadrillaEntity } from "./cuadrilla.entity";

@Entity()
export class AsignacionOrdenCuadrilla {
  @PrimaryGeneratedColumn({ name: "AOC_ID" })
  id: number;

  @ManyToOne(() => OrdenTrabajoEntity, { nullable: true })
  @JoinColumn({ name: "AOC_ORDEN_TRABAJO_ID" })
  ordenTrabajo: OrdenTrabajoEntity | null;

  @Column({ name: "AOC_ORDEN_TRABAJO_ID", type: "number", nullable: true, insert: false, update: false }) // ✅ agregado
  ordenTrabajoId: number | null;

  @ManyToOne(() => CuadrillaEntity, { nullable: false })
  @JoinColumn({ name: "AOC_CUADRILLA_ID" })
  cuadrilla: CuadrillaEntity;

  @Column({ name: "AOC_CUADRILLA_ID", type: "number", insert: false, update: false }) // ✅ agregado
  cuadrillaId: number;

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