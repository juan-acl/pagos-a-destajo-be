import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("DES_ASIGNACION_ORDEN_CUADRILLA")
export class AsignacionOrdenCuadrillaEntity {
  @PrimaryGeneratedColumn({ name: "AOC_ID" })
  id: number;

  @Column({ type: "number", nullable: false, name: "AOC_ORDEN_TRABAJO_ID" })
  ordenTrabajoId: number;

  @Column({ type: "number", nullable: false, name: "AOC_CUADRILLA_ID" })
  cuadrillaId: number;

  @Column({ type: "number", nullable: false, name: "AOC_CANTIDAD_ASIGNADA" })
  cantidadAsignada: number;

  @Column({ type: "varchar", length: 50, nullable: false, name: "AOC_ESTADO", default: "activo" })
  estado: string;

  @CreateDateColumn({ name: "AOC_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "AOC_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @Column({ type: "timestamp", nullable: true, name: "AOC_FECHA_ELIMINACION" })
  fechaEliminacion: Date | null;
}
