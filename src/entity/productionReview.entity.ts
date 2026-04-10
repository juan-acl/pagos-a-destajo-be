import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from "typeorm";

@Entity("DES_REVISION_PRODUCCION")
export class RevisionProduccion {
  @PrimaryGeneratedColumn({ name: "RVP_ID" })
  id: number;

  @Column({ name: "RVP_CANTIDAD_RECIBIDA", type: "number", nullable: false })
  cantidadRecibida: number;

  @Column({ name: "RVP_CANTIDAD_APROBADA", type: "number", nullable: false })
  cantidadAprobada: number;

  @Column({ name: "RVP_ESTADO_REVISION", type: "varchar2", length: 50, nullable: false })
  estadoRevision: string;

  @Column({ name: "RVP_OBSERVACIONES", type: "varchar2", length: 255, nullable: true })
  observaciones?: string;

  @Column({ name: "RVP_FECHA_REVISION", type: "date", nullable: false })
  fechaRevision: Date;

  @Column({ name: "RVP_ASIGNACION_EMPLEADO_ID", type: "number", nullable: false })
  asignacionEmpleadoId: number;

  @CreateDateColumn({ name: "RVP_FECHA_CREACION", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "RVP_FECHA_ACTUALIZACION", type: "timestamp" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "RVP_FECHA_ELIMINACION", type: "timestamp", nullable: true })
  deletedAt: Date | null;
}