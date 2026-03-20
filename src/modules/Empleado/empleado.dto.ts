import { z } from "zod";

export const CreateEmpleadoDto = z.object({
  primerNombre: z.string().min(1).max(100),
  segundoNombre: z.string().max(100).nullable().optional(),
  primerApellido: z.string().min(1).max(100),
  segundoApellido: z.string().max(100).nullable().optional(),
  email: z.string().email().max(150),
  password: z.string().min(6).max(255),
  codigoEmpleado: z.string().max(50).nullable().optional(),
  pstPuesto: z.coerce.number().int().positive().nullable().optional(),
  estado: z.string().max(20).optional(),
});

export const UpdateEmpleadoDto = CreateEmpleadoDto.partial().extend({
  password: z.string().min(6).max(255).optional().or(z.literal("")),
});

export type CreateEmpleadoDtoType = z.infer<typeof CreateEmpleadoDto>;
export type UpdateEmpleadoDtoType = z.infer<typeof UpdateEmpleadoDto>;