<<<<<<< Updated upstream
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("DES_MEDIDAS")
export class MedidaEntity {
  @PrimaryGeneratedColumn({ name: "MED_ID" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, name: "MED_NOMBRE" })
  nombre: string;

  @Column({ type: "varchar", length: 20, nullable: false, name: "MED_INICIALES" })
=======
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity()
export class Medidas {
  @PrimaryGeneratedColumn({ name: "MED_ID" })
  id: number;

  @Column({ name: "MED_NOMBRE", type: "varchar2", length: 100 })
  nombre: string;

  @Column({ name: "MED_INICIALES", type: "varchar2", length: 20 })
>>>>>>> Stashed changes
  iniciales: string;

  @CreateDateColumn({ name: "MED_FECHA_CREACION" })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: "MED_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

<<<<<<< Updated upstream
  @Column({ type: "timestamp", nullable: true, name: "MED_FECHA_ELIMINACION" })
  fechaEliminacion: Date | null;
}
=======
  @DeleteDateColumn({ name: "MED_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
}
>>>>>>> Stashed changes
