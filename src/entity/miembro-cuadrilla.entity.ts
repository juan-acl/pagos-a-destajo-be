import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../shared/base.entity";
import { EmpleadoEntity } from "./empleado.entity";
import { CuadrillaEntity } from "./cuadrilla.entity";

@Entity("PRD_MIEMBRO_CUADRILLA")
export class MiembroCuadrillaEntity extends BaseEntity {
    @ManyToOne(() => EmpleadoEntity)
    @JoinColumn({ name: "EMP_empleado" })
    empleado: EmpleadoEntity;

    @Column({ name: "EMP_empleado", type: "number" })
    empleadoId: number;

    @ManyToOne(() => CuadrillaEntity)
    @JoinColumn({ name: "CUA_cuadrilla" })
    cuadrilla: CuadrillaEntity;

    @Column({ name: "CUA_cuadrilla", type: "number" })
    cuadrillaId: number;

    @Column({ name: "MIC_fecha_ingreso", type: "date", nullable: true })
    fechaIngreso: Date | null;

    @Column({ name: "MIC_estado", type: "varchar", length: 20, default: "activo" })
    estado: string;
}