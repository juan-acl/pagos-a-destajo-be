import {
    Entity, Column, PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from "typeorm";

@Entity("DES_CUADRILLA")
export class CuadrillaEntity {
    @PrimaryGeneratedColumn({ name: "CUA_ID" })
    id: number;

    @Column({ name: "CUA_AREA_ID", type: "number", nullable: true })
    areaId: number | null;

    @Column({ name: "CUA_CODIGO_CUADRILLA", type: "varchar", length: 50, nullable: true })
    codigoCuadrilla: string | null;

    @Column({ name: "CUA_NOMBRE", type: "varchar", length: 100, nullable: false })
    nombre: string;

    @Column({ name: "CUA_ESTADO", type: "varchar", length: 20, nullable: false, default: "ACTIVO" })
    estado: string;

    @CreateDateColumn({ name: "CUA_FECHA_CREACION" })
    createdAt: Date;

    @UpdateDateColumn({ name: "CUA_FECHA_ACTUALIZACION" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "CUA_FECHA_ELIMINACION", nullable: true })
    deletedAt: Date | null;
}