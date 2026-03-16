import { z } from "zod";
import { zStatus } from "../../shared/status";

export const CreateAreaDto = z.object({
  nombre: z.string().min(1).max(100),
  codigoArea: z.string().min(1).max(150),
  estado: zStatus,
});

export const UpdateAreaDto = CreateAreaDto.partial();

export type CreateAreaDtoType = z.infer<typeof CreateAreaDto>;
export type UpdateAreaDtoType = z.infer<typeof UpdateAreaDto>;
  