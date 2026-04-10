import { z } from "zod";

export const CreateProductionLotDto = z.object({
  numeroLote: z.string().min(1).max(100),
  totalPiezasAprobadas: z.coerce.number().nonnegative(),
  fechaEnvio: z.coerce.date(),
  estado: z.string().min(1).max(50),
  revisionProduccionId: z.coerce.number().int().positive().optional(),
});

export const UpdateProductionLotDto = CreateProductionLotDto.partial();

export type CreateProductionLotDtoType = z.infer<typeof CreateProductionLotDto>;
export type UpdateProductionLotDtoType = z.infer<typeof UpdateProductionLotDto>;
