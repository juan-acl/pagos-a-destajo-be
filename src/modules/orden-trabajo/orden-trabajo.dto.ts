import { z } from "zod";

export const CreateOrdenTrabajoDto = z.object({
  numeroOrden: z.string().min(1).max(100),
  cantidadRequerida: z.number().int().positive(),
  medidaId: z.number().int().positive().nullable().optional(),
  pagoUnitario: z.number().positive(),
  fechaLimite: z.string().nullable().optional(),
  estado: z.string().max(50).optional(),
});

export const UpdateOrdenTrabajoDto = CreateOrdenTrabajoDto.partial();

export type CreateOrdenTrabajoDtoType = z.infer<typeof CreateOrdenTrabajoDto>;
export type UpdateOrdenTrabajoDtoType = z.infer<typeof UpdateOrdenTrabajoDto>;