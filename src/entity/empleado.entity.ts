import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Empleado {
    @PrimaryGeneratedColumn({ name: "EMP_ID" })
    id: number;
    
    @Column({ name: "EMP_PST_PUESTO", type: "number", nullable: true })
    pstPuesto: number | null;

    @Column({ name: "EMP_CODIGO_EMPLEADO", type: "varchar", length: 50, nullable: true })
    codigoEmpleado: string | null;

    @Column({ name: "EMP_PRIMER_NOMBRE", type: "varchar", length: 100 })
    primerNombre: string;

    @Column({ name: "EMP_SEGUNDO_NOMBRE", type: "varchar", length: 100, nullable: true })
    segundoNombre: string | null;

    @Column({ name: "EMP_PRIMER_APELLIDO", type: "varchar", length: 100 })
    primerApellido: string;

    @Column({ name: "EMP_SEGUNDO_APELLIDO", length: 100, nullable: true })
    segundoApellido: string | null;

    @Column({ name: "EMP_EMAIL", type: "varchar", length: 150, unique: true })
    email: string;

    @Column({ name: "EMP_PASSWORD", type: "varchar", length: 255 })
    password: string;

    @Column({ name: "EMP_ESTADO", type: "varchar", length: 20, default: "activo" })
    estado: string;

    @CreateDateColumn({ name: "EMP_FECHA_CREACION" })
    fechaCreacion: Date;
  
    @UpdateDateColumn({ name: "EMP_FECHA_ACTUALIZACION" })
    fechaActualizacion: Date;
  
    @DeleteDateColumn({ name: "EMP_FECHA_ELIMINACION" })
    fechaEliminacion: Date;
}