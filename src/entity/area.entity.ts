import { Entity, Column, PrimaryGeneratedColumn, DeleteDateColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { StatusType, zStatus } from "../shared/status";

@Entity()
export class Area {
  @PrimaryGeneratedColumn({ name: "ARE_ID" })
  id: number;

  @Column({ name: "ARE_CODIGO_AREA", type: "varchar", length: 50, nullable: false, unique: true })
  codigoArea: string;

  @Column({ name: "ARE_NOMBRE", type: "varchar", length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ name: "ARE_ESTADO", type: "varchar",length: 50, nullable: false, enum: zStatus })
  estado: StatusType;

  @CreateDateColumn({ name: "ARE_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "ARE_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "ARE_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}
