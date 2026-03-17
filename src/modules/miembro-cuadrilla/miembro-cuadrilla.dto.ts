import { z } from "zod";

export const CreateMiembroDto = z.object({
    empleadoId: z.number().int().positive(),
    cuadrillaId: z.number().int().positive(),
    fechaIngreso: z.string().datetime().nullable().optional(),
    estado: z.string().max(20).optional(),
});

export const UpdateMiembroDto = CreateMiembroDto.partial();

export type CreateMiembroDtoType = z.infer<typeof CreateMiembroDto>;
export type UpdateMiembroDtoType = z.infer<typeof UpdateMiembroDto>;