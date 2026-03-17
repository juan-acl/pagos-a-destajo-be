import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorMiddleware = (err: any, req: Request, res: Response, nex: NextFunction) => {
  console.error(`[${req.method}] ${req.path} →`, err.message || err);

  if (err.code || err.errorNum) {
    return res.status(500).json({
      success: false,
      message: "Error de base de datos",
      error:`${err.errorNum ? `ORA-${err.errorNum}: ` : ""}${err.message}` 
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors.map((e) => ({
        field:   e.path.join("."),
        message: e.message,
      })),
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
};
