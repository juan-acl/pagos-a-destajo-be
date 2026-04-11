<<<<<<< Updated upstream
import {
    Entity, Column, PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from "typeorm";

@Entity("DES_EMPLEADO")
export class EmpleadoEntity {
    @PrimaryGeneratedColumn({ name: "EMP_ID" })
    id: number;

    @Column({ name: "EMP_PST_PUESTO", type: "number", nullable: true })
    pstPuesto: number | null;
=======
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Empleado {
  @PrimaryGeneratedColumn({ name: "EMP_ID" })
  id: number;
>>>>>>> Stashed changes

  @Column({ name: "EMP_PST_PUESTO", type: "number", nullable: true })
  pstPuesto: number | null;

<<<<<<< Updated upstream
    @Column({ name: "EMP_PRIMER_NOMBRE", type: "varchar", length: 100, nullable: false })
    primerNombre: string;
=======
  @Column({ name: "EMP_CODIGO_EMPLEADO", type: "varchar", length: 50, nullable: true })
  codigoEmpleado: string | null;
>>>>>>> Stashed changes

  @Column({ name: "EMP_PRIMER_NOMBRE", type: "varchar", length: 100 })
  primerNombre: string;

<<<<<<< Updated upstream
    @Column({ name: "EMP_PRIMER_APELLIDO", type: "varchar", length: 100, nullable: false })
    primerApellido: string;
=======
  @Column({ name: "EMP_SEGUNDO_NOMBRE", type: "varchar", length: 100, nullable: true })
  segundoNombre: string | null;
>>>>>>> Stashed changes

  @Column({ name: "EMP_PRIMER_APELLIDO", type: "varchar", length: 100 })
  primerApellido: string;

  @Column({ name: "EMP_SEGUNDO_APELLIDO", length: 100, nullable: true })
  segundoApellido: string | null;

  @Column({ name: "EMP_EMAIL", type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ name: "EMP_PASSWORD", type: "varchar", length: 255 })
  password: string;

  @Column({ name: "EMP_ESTADO", type: "varchar", length: 20, default: "ACTIVO" }) // ✅ corregido a mayúsculas
  estado: string;

  @CreateDateColumn({ name: "EMP_FECHA_CREACION" })
  fechaCreacion: Date;

<<<<<<< Updated upstream
    @DeleteDateColumn({ name: "EMP_FECHA_ELIMINACION", type: "timestamp", nullable: true })
    deletedAt: Date | null;
=======
  @UpdateDateColumn({ name: "EMP_FECHA_ACTUALIZACION" })
  fechaActualizacion: Date;

  @DeleteDateColumn({ name: "EMP_FECHA_ELIMINACION" })
  fechaEliminacion: Date;
>>>>>>> Stashed changes
}