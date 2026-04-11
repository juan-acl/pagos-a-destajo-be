import { z } from "zod";

export const CreateProductionLotDto = z.object({
  numeroLote: z.string().min(1).max(100).optional(),
  totalPiezasAprobadas: z.coerce.number().nonnegative().optional(),
  fechaEnvio: z.coerce.date().optional(),
  estado: z.string().min(1).max(50).optional(),
  revisionProduccionId: z.coerce.number().int().positive().optional(),
  asignacionOrdenCuadrillaId: z.coerce.number().int().positive().optional(),
});

export const UpdateProductionLotDto = CreateProductionLotDto.partial();

export type CreateProductionLotDtoType = z.infer<typeof CreateProductionLotDto>;
export type UpdateProductionLotDtoType = z.infer<typeof UpdateProductionLotDto>;
