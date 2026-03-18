import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity()
export class Cuadrilla  {
    @PrimaryGeneratedColumn({ name: "CUA_ID" })
    id: number;
    
    @Column({ name: "CUA_AREA_ID", type: "number", nullable: true })
    areaId: number | null;

    @Column({ name: "CUA_CODIGO_CUADRILLA", type: "varchar", length: 50, nullable: true })
    codigoCuadrilla: string | null;

    @Column({ name: "CUA_NOMBRE", type: "varchar", length: 100 })
    nombre: string;

    @Column({ name: "CUA_ESTADO", type: "varchar", length: 20, default: "activo" })
    estado: string;

    @CreateDateColumn({ name: "CUA_FECHA_CREACION" })
    fechaCreacion: Date;
  
    @UpdateDateColumn({ name: "CUA_FECHA_ACTUALIZACION" })
    fechaActualizacion: Date;
  
    @DeleteDateColumn({ name: "CUA_FECHA_ELIMINACION" })
    fechaEliminacion: Date; 
}