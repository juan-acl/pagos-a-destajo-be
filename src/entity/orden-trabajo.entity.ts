import { Entity, Column } from "typeorm";
import { BaseEntity } from "../shared/base.entity";

@Entity("PRD_ORDEN_TRABAJO")
export class OrdenTrabajoEntity extends BaseEntity {
  @Column({ type: "varchar", length: 100, nullable: false, name: "ODT_numero_orden" })
  numeroOrden: string;

  @Column({ type: "number", nullable: false, name: "ODT_cantidad_requerida" })
  cantidadRequerida: number;

  @Column({ type: "number", nullable: true, name: "MED_medidas" })
  medidaId: number | null;

  @Column({ type: "decimal", nullable: false, name: "ODT_pago_unitario" })
  pagoUnitario: number;

  @Column({ type: "timestamp", nullable: true, name: "ODT_fecha_limite" })
  fechaLimite: Date | null;

  @Column({ type: "varchar", length: 50, nullable: false, name: "ODT_estado", default: "activo" })
  estado: string;
}
