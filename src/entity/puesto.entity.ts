import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { StatusType, zStatus } from "../shared/status";

@Entity()
export class Puesto {
  @PrimaryGeneratedColumn({ name: "PST_ID" })
  id: number;
  
  @Column({ name: "PST_NOMBRE", type: "varchar", length: 200, nullable: false, unique: true })
  nombre: string;

  @Column({ name: "PST_DESCRIPCION", type: "varchar", length: 200, nullable: false })
  descripcion: string;

  @Column({ name: "PST_ESTADO", type: "varchar",length: 50, nullable: false, enum: zStatus })
  estado: StatusType;

  @CreateDateColumn({ name: "PST_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "PST_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "PST_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}