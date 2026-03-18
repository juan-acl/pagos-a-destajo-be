import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from "typeorm";

export abstract class BaseEntity {

  @CreateDateColumn()
  fecha_creacion: Date;

  @UpdateDateColumn()
  fecha_actualizacion: Date;

  @DeleteDateColumn()
  fecha_eliminacion: Date;
}
