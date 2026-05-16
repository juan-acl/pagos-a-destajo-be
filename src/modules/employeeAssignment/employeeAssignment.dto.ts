import { z } from "zod";

export const CreateEmployeeAssignmentDto = z.object({
  metaIndividual: z.coerce.number().nonnegative(),
  estado: z.string().min(1).max(50),
  cuadrillaId: z.coerce.number().int().positive(),
});

export const UpdateEmployeeAssignmentDto = CreateEmployeeAssignmentDto.partial();

export const SetPaymentModalityDto = z
  .object({
    asignacionOrdenCuadrillaId: z.coerce.number().int().positive(),
    modalidad: z.enum(["DESTAJO", "DESTAJ0", "PAGO_POR_DIAS"]),
    varianteDias: z.enum(["DIAS_VENCIDOS", "DIAS_FUTUROS", "PROGRAMADOS"]).optional(),
    montoDiario: z.coerce.number().positive().optional(),
    fechaInicio: z.coerce.date().optional(),
    fechaFin: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.modalidad === "PAGO_POR_DIAS") {
      if (!value.varianteDias) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["varianteDias"], message: "Debe seleccionar la variante de pago por días." });
      }
      if (value.montoDiario == null || value.montoDiario <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["montoDiario"], message: "Debe indicar un monto diario mayor a cero." });
      }
      if (!value.fechaInicio) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fechaInicio"], message: "Debe indicar fecha inicial." });
      }
      if (!value.fechaFin) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fechaFin"], message: "Debe indicar fecha final." });
      }
      if (value.fechaInicio && value.fechaFin && value.fechaFin < value.fechaInicio) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fechaFin"], message: "La fecha final no puede ser menor que la fecha inicial." });
      }
    }
  });

// Se conserva para compatibilidad con pantallas/rutas anteriores. Ya no debe usarse para crear metas individuales.
export const DistributeEmployeeAssignmentsDto = z.object({
  asignacionOrdenCuadrillaId: z.coerce.number().int().positive(),
  modo: z.enum(["AUTOMATICA", "MANUAL", "SINCRONIZAR"]).optional().default("SINCRONIZAR"),
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
export type SetPaymentModalityDtoType = z.infer<typeof SetPaymentModalityDto>;
export type DistributeEmployeeAssignmentsDtoType = z.infer<typeof DistributeEmployeeAssignmentsDto>;
