import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("DES_LOTE_PRODUCCION")
export class LoteProduccion {
  @PrimaryGeneratedColumn({
    name: "LTP_ID",
    type: "number",
  })
  id!: number;

  @Column({
    name: "LTP_NUMERO_LOTE",
    type: "varchar2",
    length: 100,
    nullable: false,
  })
  numeroLote!: string;

  @Column({
    name: "LTP_TOTAL_PIEZAS_APROBADAS",
    type: "number",
    nullable: false,
  })
  totalPiezasAprobadas!: number;

  @Column({
    name: "LTP_FECHA_ENVIO",
    type: "date",
    nullable: false,
  })
  fechaEnvio!: Date;

  @Column({
    name: "LTP_ESTADO",
    type: "varchar2",
    length: 50,
    nullable: false,
  })
  estado!: string;

  @Column({
    name: "LTP_FECHA_CREACION",
    type: "timestamp",
    nullable: false,
  })
  fechaCreacion!: Date;

  @Column({
    name: "LTP_FECHA_ACTUALIZACION",
    type: "timestamp",
    nullable: false,
  })
  fechaActualizacion!: Date;

  @Column({
    name: "LTP_FECHA_ELIMINACION",
    type: "timestamp",
    nullable: true,
  })
  fechaEliminacion!: Date | null;

  @Column({
    name: "LTP_REVISION_PRODUCCION_ID",
    type: "number",
    nullable: true,
  })
  revisionProduccionId!: number | null;
}