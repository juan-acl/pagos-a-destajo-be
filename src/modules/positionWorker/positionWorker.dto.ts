import { z } from "zod";

export const CreatePositionWorkerDto = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().min(1).max(150),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

  export const UpdatePositionWorkerDto = CreatePositionWorkerDto.partial();

export type CreatePositionWorkerDtoType = z.infer<typeof CreatePositionWorkerDto>;
export type UpdatePositionWorkerDtoType = z.infer<typeof UpdatePositionWorkerDto>;
