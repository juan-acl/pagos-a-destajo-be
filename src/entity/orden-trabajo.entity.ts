import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("DES_ORDEN_TRABAJO")
export class OrdenTrabajoEntity {
  @PrimaryGeneratedColumn({ name: "ODT_ID" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, name: "ODT_NUMERO_ORDEN" })
  numeroOrden: string;

  @Column({ type: "number", nullable: false, name: "ODT_CANTIDAD_REQUERIDA" })
  cantidadRequerida: number;

  @Column({ type: "number", nullable: true, name: "ODT_MEDIDAS_ID" })
  medidaId: number | null;

  @Column({ type: "decimal", nullable: false, name: "ODT_PAGO_UNITARIO" })
  pagoUnitario: number;

  @Column({ type: "timestamp", nullable: true, name: "ODT_FECHA_LIMITE" })
  fechaLimite: Date | null;

  @Column({ type: "varchar", length: 50, nullable: false, name: "ODT_ESTADO", default: "activo" })
  estado: string;

  @CreateDateColumn({ name: "ODT_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "ODT_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @Column({ type: "timestamp", nullable: true, name: "ODT_FECHA_ELIMINACION" })
  fechaEliminacion: Date | null;
}
