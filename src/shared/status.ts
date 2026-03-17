import { z } from "zod";

export const zStatus = z.enum(["ACTIVO", "INACTIVO"])
export type StatusType = z.infer<typeof zStatus>