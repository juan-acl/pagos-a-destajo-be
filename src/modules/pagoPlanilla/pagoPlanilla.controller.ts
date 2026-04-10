import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { NotFoundError, BadRequestError } from "../../error/customErrors";
import { PaymentService } from "./pagoPlanilla.service";

export class PaymentController {
  private readonly service = new PaymentService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };

  getPendientes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPendientes();
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(Number(req.params.id));
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(
          res,
          "Verifique el identificador de la busqueda",
        );
      next(e);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.previewPlanilla(
        Number(req.params.loteId),
      );
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  generar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.generarPlanilla(
        Number(req.params.loteId),
      );
      HttpResponse.created(res, data);
    } catch (e) {
      console.error("Error al generar planilla:", e);
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  previewByOrden = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.previewPlanillaByOrden(
        Number(req.params.ordenId),
      );
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  generarByOrden = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.generarPlanillaByOrden(
        Number(req.params.ordenId),
      );
      HttpResponse.created(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  ejecutarPago = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.ejecutarPago(
        Number(req.params.id),
        req.body,
      );
      HttpResponse.ok(res, data, "Pago ejecutado correctamente");
    } catch (e) {
      console.log("Error en ejecutarPago:", e);
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  rechazar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.rechazarPlanilla(
        Number(req.params.id),
        req.body.observaciones,
      );
      HttpResponse.ok(res, data, "Planilla rechazada");
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  getDetalle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDetallePlanilla(Number(req.params.id));
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  getOrdenesDisponibles = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await this.service.getOrdenesDisponibles();
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };

  getPagoEmpleado = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPagoEmpleado(
        Number(req.params.planillaId),
        Number(req.params.empleadoId),
      );
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      next(e);
    }
  };
}
