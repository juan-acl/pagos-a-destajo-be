import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../shared/base.entity";
import { EmpleadoEntity } from "./empleado.entity";
import { CuadrillaEntity } from "./cuadrilla.entity";

@Entity("PRD_MIEMBRO_CUADRILLA")
export class MiembroCuadrillaEntity extends BaseEntity {
    @ManyToOne(() => EmpleadoEntity)
    @JoinColumn({ name: "EMP_empleado" })
    empEmpleado: EmpleadoEntity;

    @Column({ name: "EMP_empleado", type: "number", nullable: false })
    empEmpleadoId: number;

    @ManyToOne(() => CuadrillaEntity)
    @JoinColumn({ name: "CUA_cuadrilla" })
    cuaCuadrilla: CuadrillaEntity;

    @Column({ name: "CUA_cuadrilla", type: "number", nullable: false })
    cuaCuadrillaId: number;

    @Column({ name: "MIC_fecha_ingreso", type: "date", nullable: true })
    fechaIngreso: Date | null;

    @Column({ name: "MIC_estado", type: "varchar", length: 20, nullable: false, default: "ACTIVO" })
    estado: string;
}