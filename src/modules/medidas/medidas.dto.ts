import { z } from "zod";

export const CreateMedidaDto = z.object({
  nombre: z.string().min(1).max(100),
  iniciales: z.string().min(1).max(20),
});

export const UpdateMedidaDto = CreateMedidaDto.partial();

export type CreateMedidaDtoType = z.infer<typeof CreateMedidaDto>;
export type UpdateMedidaDtoType = z.infer<typeof UpdateMedidaDto>;
