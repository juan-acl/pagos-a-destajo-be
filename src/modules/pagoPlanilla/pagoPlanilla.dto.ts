import { z } from "zod";
import { zPay, zStatusPay } from "../../shared/paymentMethods";

export const CreatePaymentDto = z.object({
  loteProduccionId: z.number().positive(),
  numeroPago:  z.number().positive(),
  montoTotal:  z.number().positive(),
  descripcion: z.string().optional(),
  metodoPago: zPay,
  estado: zStatusPay,
});

export const UpdatePaymentDto = CreatePaymentDto.partial();

export type CreatePaymentDtoType = z.infer<typeof CreatePaymentDto>;
export type UpdatePaymentDtoType = z.infer<typeof UpdatePaymentDto>;