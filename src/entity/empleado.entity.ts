import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity("PRD_EMPLEADO")
export class EmpleadoEntity extends BaseEntity {
    @Column({ name: "PST_puesto", type: "number", nullable: true })
    pstPuesto: number | null;

    @Column({ name: "EMP_codigo_empleado", type: "varchar", length: 50, nullable: true })
    codigoEmpleado: string | null;

    @Column({ name: "EMP_primer_nombre", type: "varchar", length: 100 })
    primerNombre: string;

    @Column({ name: "EMP_segundo_nombre", type: "varchar", length: 100, nullable: true })
    segundoNombre: string | null;

    @Column({ name: "EMP_primer_apellido", type: "varchar", length: 100 })
    primerApellido: string;

    @Column({ name: "EMP_segundo_apellido", type: "varchar", length: 100, nullable: true })
    segundoApellido: string | null;

    @Column({ name: "EMP_email", type: "varchar", length: 150, unique: true })
    email: string;

    @Column({ name: "EMP_psswd", type: "varchar", length: 255 })
    password: string;

    @Column({ name: "EMP_estado", type: "varchar", length: 20, default: "activo" })
    estado: string;
}