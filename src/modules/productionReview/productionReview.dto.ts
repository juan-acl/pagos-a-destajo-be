import { z } from "zod";

const ProductionReviewBaseDto = z.object({
  reporteId: z.coerce.number().int().positive().optional(),
  cantidadRecibida: z.coerce.number().positive(),
  cantidadAprobada: z.coerce.number().nonnegative(),
  estadoRevision: z.string().min(1).max(50).optional(),
  observaciones: z.string().max(255).optional(),
  fechaRevision: z.coerce.date().optional(),
  asignacionEmpleadoId: z.coerce.number().int().positive().optional(),
});

export const CreateProductionReviewDto = ProductionReviewBaseDto.superRefine((value, ctx) => {
  if (!value.reporteId && !value.asignacionEmpleadoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["asignacionEmpleadoId"],
      message: "Debe indicar el reporte pendiente o la asignación de empleado.",
    });
  }
});

export const UpdateProductionReviewDto = ProductionReviewBaseDto.partial();

export type CreateProductionReviewDtoType = z.infer<typeof CreateProductionReviewDto>;
export type UpdateProductionReviewDtoType = z.infer<typeof UpdateProductionReviewDto>;
