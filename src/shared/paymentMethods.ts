import { z } from "zod";

export const zPay = z.enum(["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO"]);
export type PayType = z.infer<typeof zPay>;

export const zStatusPay = z.enum([
  "PAGADO",
  "RECHAZADO",
  "PENDIENTE",
  "INACTIVO",
  "EN_REVISION",
  "PROCESANDO",
]);

export interface DetalleEmpleado {
  empleadoId: number;
  nombreEmpleado: string;
  metaIndividual: number;
  cantidadAprobada: number;
  pagoUnitario: number;
  montoMeta: number;
  montoRealizado: number;
}

interface EvidenciaTransferencia {
  metodoPago: "TRANSFERENCIA";
  bancoDestino: string;
  numeroCuenta: string;
  numeroTransferencia: string;
  montoConfirmado: number;
}

interface EvidenciaCheque {
  metodoPago: "CHEQUE";
  numeroCheque: string;
  bancoEmisor: string;
  fechaCheque: Date;
  montoConfirmado: number;
}

interface EvidenciaEfectivo {
  metodoPago: "EFECTIVO";
  responsableEntrega: string;
  fechaEntrega: Date;
  montoConfirmado: number;
}

export type EvidenciaPagoType =
  | EvidenciaTransferencia
  | EvidenciaCheque
  | EvidenciaEfectivo;

export type StatusPayType = z.infer<typeof zStatusPay>;
