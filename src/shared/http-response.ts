import { Response } from "express";

export const HttpResponse = {
  ok(res: Response, data: any, message = "OK") {
    return res.status(200).json({ success: true, message, data });
  },
  created(res: Response, data: any, message = "Creado correctamente") {
    return res.status(201).json({ success: true, message, data });
  },
  notFound(res: Response, message = "Recurso no encontrado") {
    return res.status(404).json({ success: false, message, data: null });
  },
  badRequest(res: Response, message = "Datos inválidos", errors?: any) {
    return res.status(400).json({ success: false, message, errors });
  },
  serverError(res: Response, message = "Error interno del servidor") {
    return res.status(500).json({ success: false, message, data: null });
  },
};
