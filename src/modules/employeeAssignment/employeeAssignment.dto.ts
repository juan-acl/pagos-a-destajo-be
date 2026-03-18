import { z } from "zod";

export const CreateEmployeeAssignmentDto = z.object({
  metaIndividual: z.number(),
  estado: z.string().min(1).max(50),
  cuadrillaId: z.number().int().positive(),
});

export const UpdateEmployeeAssignmentDto = CreateEmployeeAssignmentDto.partial();

export type CreateEmployeeAssignmentDtoType = z.infer<typeof CreateEmployeeAssignmentDto>;
export type UpdateEmployeeAssignmentDtoType = z.infer<typeof UpdateEmployeeAssignmentDto>;
