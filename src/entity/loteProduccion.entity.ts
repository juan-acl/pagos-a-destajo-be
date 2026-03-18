import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { RevisionProduccion } from "./revisionProduccion.entity";

@Entity()
export class LoteProduccion {
  @PrimaryGeneratedColumn({ name: "LTP_ID" })
  id: number;
  
  @ManyToOne(() => RevisionProduccion, { nullable: true })
  @JoinColumn({ name: "LTP_REVISION_PRODUCCION_ID" })
  revisionProduccion: RevisionProduccion | null;

  @Column({ name: "LTP_NUMERO_LOTE", type: "varchar2", length: 100 })
  numeroLote: string;

  @Column({ name: "LTP_TOTAL_PIEZAS_APROBADAS", type: "number" })
  totalPiezasAprobadas: number;

  @Column({ name: "LTP_FECHA_ENVIO", type: "date" })
  fechaEnvio: Date;

  @Column({ name: "LTP_ESTADO", type: "varchar2", length: 50 })
  estado: string;

  @CreateDateColumn({ name: "LTP_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "LTP_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "LTP_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}