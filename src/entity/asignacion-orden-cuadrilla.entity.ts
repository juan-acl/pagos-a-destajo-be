import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity("PRD_ASIGNACION_ORDEN_CUADRILLA")
export class AsignacionOrdenCuadrillaEntity extends BaseEntity {
  @Column({ type: "number", nullable: false, name: "ODT_orden_trabajo" })
  ordenTrabajoId: number;

  @Column({ type: "number", nullable: false, name: "CUA_cuadrilla" })
  cuadrillaId: number;

  @Column({ type: "number", nullable: false, name: "TAC_cantidad_asignada" })
  cantidadAsignada: number;

  @Column({ type: "varchar", length: 50, nullable: false, name: "TAC_estado", default: "activo" })
  estado: string;
}
