import { z } from "zod";

export const CreateMiembroDto = z.object({
    empleadoId: z.coerce.number().int().positive(),
    cuadrillaId: z.coerce.number().int().positive(),
    fechaIngreso: z.string().nullable().optional(),
    estado: z.string().max(20).optional(),
});

export const UpdateMiembroDto = CreateMiembroDto.partial();

export type CreateMiembroDtoType = z.infer<typeof CreateMiembroDto>;
export type UpdateMiembroDtoType = z.infer<typeof UpdateMiembroDto>;