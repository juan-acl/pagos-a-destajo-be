import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: "fecha_creacion" })
  createdAt: Date;

  @UpdateDateColumn({ name: "fecha_actualizacion" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "fecha_eliminacion", nullable: true })
  deletedAt: Date | null;
}
