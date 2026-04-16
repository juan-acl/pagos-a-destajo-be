import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("DES_MEDIDAS")
export class MedidaEntity {
  @PrimaryGeneratedColumn({ name: "MED_ID" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, name: "MED_NOMBRE" })
  nombre: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "MED_INICIALES" })
  iniciales: string;

  @CreateDateColumn({ name: "MED_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "MED_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @Column({ type: "timestamp", nullable: true, name: "MED_FECHA_ELIMINACION" })
  fechaEliminacion: Date | null;
}
