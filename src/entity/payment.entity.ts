import { Entity, Column, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { BaseEntity } from "../shared/base.entity";
import { PayType, StatusPayType, zPay, zStatusPay } from "../shared/paymentMethods";

@Entity()
export class Planilla extends BaseEntity {
  // @OneToOne(() => )
  // @JoinColumn()
  @Column({ type: "int",  nullable: false })
  loteProduccionId: number 

  @Column({ type: "int",  nullable: false })
  numeroPago: number

  @Column({ type: "float", nullable: false })
  montoTotal: number
  
  @Column({ type: "varchar", length: 200, nullable: false, enum: zPay })
  metodoPago: PayType

  @Column({ type: "varchar", length: 200, nullable: false})
  descripcion: string;

  @Column({ type: "varchar",length: 50, nullable: false, enum: zStatusPay })
  estado: StatusPayType;

  @CreateDateColumn()
  fechaPago: Date
}
