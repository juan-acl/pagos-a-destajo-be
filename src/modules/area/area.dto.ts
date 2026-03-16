import { z } from "zod";

export const CreateAreaDto = z.object({
  nombre: z.string().min(1).max(100),
  codigoArea: z.string().min(1).max(150),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export const UpdateAreaDto = CreateAreaDto.partial();

export type CreateAreaDtoType = z.infer<typeof CreateAreaDto>;
export type UpdateAreaDtoType = z.infer<typeof UpdateAreaDto>;
  