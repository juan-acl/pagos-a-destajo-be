import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { Medidas } from "./medidas.entity";

@Entity()
export class OrdenTrabajo {
  @PrimaryGeneratedColumn({ name: "ODT_ID" })
  id: number;

  @Column({ name: "ODT_NUMERO_ORDEN", type: "varchar2", length: 100 })
  numeroOrden: string;

  @Column({ name: "ODT_CANTIDAD_REQUERIDA", type: "number" })
  cantidadRequerida: number;

  @ManyToOne(() => Medidas, { nullable: true })
  @JoinColumn({ name: "ODT_MEDIDAS_ID" })
  medidas: Medidas | null;

  @Column({ name: "ODT_PAGO_UNITARIO", type: "decimal" })
  pagoUnitario: number;

  @Column({ name: "ODT_FECHA_LIMITE", type: "date" })
  fechaLimite: Date;

  @Column({ name: "ODT_ESTADO", type: "varchar2", length: 50 })
  estado: string;

  @CreateDateColumn({ name: "ODT_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "ODT_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "ODT_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}