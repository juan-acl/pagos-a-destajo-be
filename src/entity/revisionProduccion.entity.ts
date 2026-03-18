import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { AsignacionEmpleado } from "./asignacionEmpleado.entity";

@Entity()
export class RevisionProduccion {
  @PrimaryGeneratedColumn({ name: "RVP_ID" })
  id: number;
  
  @ManyToOne(() => AsignacionEmpleado, { nullable: false })
  @JoinColumn({ name: "RVP_ASIGNACION_EMPLEADO_ID" })
  asignacionEmpleado: AsignacionEmpleado;

  @Column({ name: "RVP_CANTIDAD_RECIBIDA", type: "number" })
  cantidadRecibida: number;

  @Column({ name: "RVP_CANTIDAD_APROBADA", type: "number" })
  cantidadAprobada: number;

  @Column({ name: "RVP_ESTADO_REVISION", type: "varchar2", length: 50 })
  estadoRevision: string;

  @Column({ name: "RVP_OBSERVACIONES", type: "varchar2", length: 255, nullable: true })
  observaciones: string | null;

  @Column({ name: "RVP_FECHA_REVISION", type: "date" })
  fechaRevision: Date;

  @CreateDateColumn({ name: "RVP_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "RVP_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "RVP_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}