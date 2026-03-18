import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";
import { Empleado } from "./empleado.entity";
import { Cuadrilla } from "./cuadrilla.entity";

@Entity()
export class MiembroCuadrilla {
    @PrimaryGeneratedColumn({ name: "MIC_ID" })
    id: number;
    
    @ManyToOne(() => Empleado)
    @JoinColumn({ name: "MIC_EMPLEADO_ID" })
    empleado: Empleado;

    @Column({ name: "MIC_EMPLEADO_ID", type: "number" })
    empleadoId: number;

    @ManyToOne(() => Cuadrilla)
    @JoinColumn({ name: "MIC_CUADRILLA_ID" })
    cuadrilla: Cuadrilla;

    @Column({ name: "MIC_CUADRILLA_ID", type: "number" })
    cuadrillaId: number;

    @Column({ name: "MIC_FECHA_INGRESO", type: "date", nullable: true })
    fechaIngreso: Date | null;

    @Column({ name: "MIC_ESTADO", type: "varchar", length: 20, default: "activo" })
    estado: string;

    @CreateDateColumn({ name: "MIC_FECHA_CREACION" })
    fechaCreacion: Date;
  
    @UpdateDateColumn({ name: "MIC_FECHA_ACTUALIZACION" })
    fechaActualizacion: Date;
  
    @DeleteDateColumn({ name: "MIC_FECHA_ELIMINACION" })
    fechaEliminacion: Date;
}