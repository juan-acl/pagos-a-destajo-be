import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import type { EstadoRegistroDiario } from "../shared/paymentMethods";

@Entity("DES_REGISTRO_DIARIO")
export class RegistroDiario {
  @PrimaryGeneratedColumn({ name: "RD_ID" })
  id: number;

  @Column({ name: "RD_FECHA", type: "timestamp", nullable: false })
  fecha: Date;

  @Column({ name: "RD_ESTADO", type: "varchar", length: 30, nullable: false })
  estado: EstadoRegistroDiario;

  @Column({ name: "RD_MONTO_DIARIO", type: "float", nullable: false })
  montoDiario: number;

  @Column({ name: "RD_ASIGNACION_EMPLEADO_ID", type: "int", nullable: false })
  asignacionEmpleadoId: number;

  @Column({ name: "RD_CUADRILLA_ID", type: "int", nullable: false })
  cuadrillaId: number;

  @Column({ name: "RD_ORDEN_TRABAJO_ID", type: "int", nullable: false })
  ordenTrabajoId: number;

  @Column({ name: "RD_PLANILLA_ID", type: "int", nullable: true })
  planillaId: number | null;

  @CreateDateColumn({ name: "RD_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "RD_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;
}
