import { Request, Response } from "express";

export const errorMiddleware = (err: any, req: Request, res: Response) => {
  console.error(`[${req.method}] ${req.path} →`, err.message || err);

  if (err.code || err.errorNum) {
    return res.status(500).json({
      success: false,
      message: "Error de base de datos",
      error:
        process.env.NODE_ENV === "development"
          ? `${err.errorNum ? `ORA-${err.errorNum}: ` : ""}${err.message}`
          : "Error interno",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
};
