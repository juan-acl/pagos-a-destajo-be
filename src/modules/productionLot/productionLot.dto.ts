import { z } from "zod";

export const CreateProductionLotDto = z.object({
  numeroLote: z.string().min(1).max(100),
  totalPiezasAprobadas: z.number().nonnegative(),
  fechaEnvio: z.coerce.date(),
  estado: z.string().min(1).max(50),
  revisionProduccionId: z.number().int().positive().optional(),
});

export const UpdateProductionLotDto = CreateProductionLotDto.partial();

export type CreateProductionLotDtoType = z.infer<typeof CreateProductionLotDto>;
export type UpdateProductionLotDtoType = z.infer<typeof UpdateProductionLotDto>;
