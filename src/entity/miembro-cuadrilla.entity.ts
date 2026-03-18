import {
    Entity, Column, PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn
} from "typeorm";
import { EmpleadoEntity } from "./empleado.entity";
import { CuadrillaEntity } from "./cuadrilla.entity";

@Entity("DES_MIEMBRO_CUADRILLA")
export class MiembroCuadrillaEntity {
    @PrimaryGeneratedColumn({ name: "MIC_ID" })
    id: number;

    @ManyToOne(() => EmpleadoEntity)
    @JoinColumn({ name: "MIC_EMPLEADO_ID" })
    empleado: EmpleadoEntity;

    @Column({ name: "MIC_EMPLEADO_ID", type: "number", nullable: false })
    empleadoId: number;

    @ManyToOne(() => CuadrillaEntity)
    @JoinColumn({ name: "MIC_CUADRILLA_ID" })
    cuadrilla: CuadrillaEntity;

    @Column({ name: "MIC_CUADRILLA_ID", type: "number", nullable: false })
    cuadrillaId: number;

    @Column({ name: "MIC_FECHA_INGRESO", type: "date", nullable: true })
    fechaIngreso: Date | null;

    @Column({ name: "MIC_ESTADO", type: "varchar", length: 20, nullable: false, default: "ACTIVO" })
    estado: string;

    @CreateDateColumn({ name: "MIC_FECHA_CREACION" })
    createdAt: Date;

    @UpdateDateColumn({ name: "MIC_FECHA_ACTUALIZACION" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "MIC_FECHA_ELIMINACION", nullable: true })
    deletedAt: Date | null;
}