import { z } from "zod";

export const CreateCuadrillaDto = z.object({
    nombre: z.string().min(1).max(100),
    codigoCuadrilla: z.string().max(50).nullable().optional(),
    areaId: z.coerce.number().int().positive().nullable().optional(),
    estado: z.string().max(20).optional(),
});

export const UpdateCuadrillaDto = CreateCuadrillaDto.partial();

export type CreateCuadrillaDtoType = z.infer<typeof CreateCuadrillaDto>;
export type UpdateCuadrillaDtoType = z.infer<typeof UpdateCuadrillaDto>;