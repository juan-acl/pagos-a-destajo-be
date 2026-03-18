import { Entity, Column, OneToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { PayType, StatusPayType, zPay, zStatusPay } from "../shared/paymentMethods";
import { LoteProduccion } from "./loteProduccion.entity";

@Entity()
export class Planilla {
  @PrimaryGeneratedColumn({ name: "PGP_ID" })
  id: number;
  
  @OneToOne(() => LoteProduccion, { nullable: false })
  @JoinColumn({ name: "PGP_LOTE_PRODUCCION_ID" })
  loteProduccion: LoteProduccion;

  @Column({ name: "PGP_NUMERO_PAGO", type: "int",  nullable: false })
  numeroPago: number

  @Column({ name: "PGP_MONTO_TOTAL", type: "float", nullable: false })
  montoTotal: number
  
  @Column({ name: "PGP_METODO_PAGO", type: "varchar", length: 200, nullable: false, enum: zPay })
  metodoPago: PayType

  @Column({ name: "PGP_DESCRIPCION", type: "varchar", length: 200, nullable: false})
  descripcion: string;

  @Column({ name: "PGP_ESTADO", type: "varchar",length: 50, nullable: false, enum: zStatusPay })
  estado: StatusPayType;

  @CreateDateColumn({ name: "PGP_FECHA_PAGO" })
  fechaPago: Date

  @CreateDateColumn({ name: "PGP_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "PGP_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "PGP_FECHA_ELIMINACION" })
  fechaEliminacion: Date; 
}
