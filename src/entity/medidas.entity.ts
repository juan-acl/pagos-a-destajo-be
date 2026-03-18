import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity()
export class Medidas {
  @PrimaryGeneratedColumn({ name: "MED_ID" })
  id: number;

  @Column({ name: "MED_NOMBRE", type: "varchar2", length: 100 })
  nombre: string;

  @Column({ name: "MED_INICIALES", type: "varchar2", length: 20 })
  iniciales: string;

  @CreateDateColumn({ name: "MED_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "MED_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "MED_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}