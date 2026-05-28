import { z } from "zod";

export const RegistrarDiasDto = z.object({
  ordenId: z.number().int().positive(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
});

export type RegistrarDiasDtoType = z.infer<typeof RegistrarDiasDto>;
