import { z } from "zod";

export const CreateUserDto = z.object({
  nombre: z.string().min(1).max(100),
  correo: z.string().email().max(150),
  idRol: z.number().int().positive(),
  idCuadrilla: z.number().int().positive().nullable().optional(),
});

export const UpdateUserDto = CreateUserDto.partial();

export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;
