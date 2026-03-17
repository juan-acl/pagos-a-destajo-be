import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity("PRD_CUADRILLA")
export class CuadrillaEntity extends BaseEntity {
    @Column({ name: "ARE_area", type: "number", nullable: true })
    areArea: number | null;

    @Column({ name: "CUA_codigo_cuadrilla", type: "varchar", length: 50, nullable: true })
    codigoCuadrilla: string | null;

    @Column({ name: "CUA_nombre", type: "varchar", length: 100, nullable: false })
    nombre: string;

    @Column({ name: "CUA_estado", type: "varchar", length: 20, nullable: false, default: "ACTIVO" })
    estado: string;
}