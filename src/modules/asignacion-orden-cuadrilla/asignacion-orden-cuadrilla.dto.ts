import { z } from "zod";

export const CreateAsignacionOrdenCuadrillaDto = z.object({
  ordenTrabajoId: z.number().int().positive(),
  cuadrillaId: z.number().int().positive(),
  cantidadAsignada: z.number().int().positive(),
  estado: z.string().max(50).optional(),
});

export const UpdateAsignacionOrdenCuadrillaDto = CreateAsignacionOrdenCuadrillaDto.partial();

export type CreateAsignacionOrdenCuadrillaDtoType = z.infer<typeof CreateAsignacionOrdenCuadrillaDto>;
export type UpdateAsignacionOrdenCuadrillaDtoType = z.infer<typeof UpdateAsignacionOrdenCuadrillaDto>;
