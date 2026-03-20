import { z } from "zod";

export const CreateProductionReviewDto = z.object({
  cantidadRecibida: z.number().nonnegative(),
  cantidadAprobada: z.number().nonnegative(),
  estadoRevision: z.string().min(1).max(50),
  observaciones: z.string().max(255).optional(),
  fechaRevision: z.coerce.date(),
  asignacionEmpleadoId: z.number().int().positive(),
});

export const UpdateProductionReviewDto = CreateProductionReviewDto.partial();

export type CreateProductionReviewDtoType = z.infer<typeof CreateProductionReviewDto>;
export type UpdateProductionReviewDtoType = z.infer<typeof UpdateProductionReviewDto>;
