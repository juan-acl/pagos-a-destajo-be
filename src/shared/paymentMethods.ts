import { z } from "zod";

export const zPay = z.enum(["CONTADO"])
export type PayType = z.infer<typeof zPay>

export const zStatusPay = z.enum(["PAGADO", "RECHAZADO"])
export type StatusPayType = z.infer<typeof zStatusPay>