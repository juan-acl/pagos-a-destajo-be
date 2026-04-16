import { z } from "zod";

export const CreateEmployeeAssignmentDto = z.object({
  metaIndividual: z.coerce.number().nonnegative(),
  estado: z.string().min(1).max(50),
  cuadrillaId: z.coerce.number().int().positive(),
});

export const UpdateEmployeeAssignmentDto = CreateEmployeeAssignmentDto.partial();

export const DistributeEmployeeAssignmentsDto = z.object({
  asignacionOrdenCuadrillaId: z.coerce.number().int().positive(),
  modo: z.enum(["AUTOMATICA", "MANUAL"]),
  metas: z
    .array(
      z.object({
        empleadoId: z.coerce.number().int().positive(),
        metaIndividual: z.coerce.number().int().nonnegative(),
      }),
    )
    .default([]),
});

export type CreateEmployeeAssignmentDtoType = z.infer<typeof CreateEmployeeAssignmentDto>;
export type UpdateEmployeeAssignmentDtoType = z.infer<typeof UpdateEmployeeAssignmentDto>;
export type DistributeEmployeeAssignmentsDtoType = z.infer<typeof DistributeEmployeeAssignmentsDto>;
