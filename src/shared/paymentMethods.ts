import { z } from "zod";

export const zPay = z.enum(["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "OTRO"]);
export type PayType = z.infer<typeof zPay>;

export const zStatusPay = z.enum([
  "PAGADO",
  "RECHAZADO",
  "PENDIENTE",
  "INACTIVO",
]);
export type StatusPayType = z.infer<typeof zStatusPay>;
