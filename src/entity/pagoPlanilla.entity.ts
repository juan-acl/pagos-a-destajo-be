import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import {
  PayType,
  StatusPayType,
  zPay,
  zStatusPay,
} from "../shared/paymentMethods";
import type { Modalidad } from "../shared/paymentMethods";
import { LoteProduccion } from "./productionLot.entity";

@Entity()
export class Planilla {
  @PrimaryGeneratedColumn({ name: "PGP_ID" })
  id: number;

  @OneToOne(() => LoteProduccion, { nullable: true })
  @JoinColumn({ name: "PGP_LOTE_PRODUCCION_ID" })
  loteProduccion: LoteProduccion | null;

  @Column({ name: "PGP_NUMERO_PAGO", type: "int", nullable: false })
  numeroPago: number;

  @Column({ name: "PGP_CODIGO_PLANILLA", type: "varchar", length: 30, nullable: true })
  codigoPlanilla: string | null;

  @Column({ name: "PGP_MODALIDAD", type: "varchar", length: 20, nullable: true, default: "DESTAJO" })
  modalidad: Modalidad | null;

  @Column({ name: "PGP_ORDEN_TRABAJO_ID", type: "int", nullable: true })
  ordenTrabajoId: number | null;

  @Column({ name: "PGP_FECHA_INICIO_PAGO", type: "timestamp", nullable: true })
  fechaInicioPago: Date | null;

  @Column({ name: "PGP_FECHA_FIN_PAGO", type: "timestamp", nullable: true })
  fechaFinPago: Date | null;

  @Column({ name: "PGP_MONTO_TOTAL", type: "float", nullable: false })
  montoTotal: number;

  @Column({ name: "PGP_METODO_PAGO", type: "varchar", length: 200, nullable: false, enum: zPay })
  metodoPago: PayType;

  @Column({ name: "PGP_DESCRIPCION", type: "varchar", length: 500, nullable: false })
  descripcion: string;

  @Column({ name: "PGP_ESTADO", type: "varchar", length: 50, nullable: false, enum: zStatusPay })
  estado: StatusPayType;

  @CreateDateColumn({ name: "PGP_FECHA_PAGO" })
  fechaPago: Date;

  @CreateDateColumn({ name: "PGP_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "PGP_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "PGP_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}