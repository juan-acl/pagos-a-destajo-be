import { z } from "zod";
import { zStatus } from "../../shared/status";

export const CreatePositionWorkerDto = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().min(1).max(150),
  estado: zStatus,
});

  export const UpdatePositionWorkerDto = CreatePositionWorkerDto.partial();

export type CreatePositionWorkerDtoType = z.infer<typeof CreatePositionWorkerDto>;
export type UpdatePositionWorkerDtoType = z.infer<typeof UpdatePositionWorkerDto>;
