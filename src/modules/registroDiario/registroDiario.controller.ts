import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { RegistroDiarioService } from "./registroDiario.service";
import { RegistrarDiasDto } from "./registroDiario.dto";

export class RegistroDiarioController {
  private readonly service = new RegistroDiarioService();

  registrarDias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = RegistrarDiasDto.parse(req.body);
      const data = await this.service.registrarDias(dto);
      HttpResponse.created(res, data, "Días registrados correctamente");
    } catch (e: any) {
      if (e?.name === "ZodError")
        return HttpResponse.badRequest(res, "Datos inválidos", e.errors);
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, e.message);
      if (e instanceof BadRequestError)
        return HttpResponse.badRequest(res, e.message);
      next(e);
    }
  };

  activarVigencia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ordenId = req.body.ordenId ? Number(req.body.ordenId) : undefined;
      const data = await this.service.actualizarVigencia(ordenId);
      HttpResponse.ok(res, data, `${data.activados} registros habilitados`);
    } catch (e) {
      next(e);
    }
  };

  getHabilitados = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ordenId = Number(req.params.ordenId);
      const { fechaInicio, fechaFin } = req.query as Record<string, string>;

      if (!fechaInicio || !fechaFin) {
        return HttpResponse.badRequest(
          res,
          "Se requieren los parámetros fechaInicio y fechaFin (YYYY-MM-DD)",
        );
      }

      await this.service.actualizarVigencia(ordenId);
      const data = await this.service.getDiasHabilitados(
        ordenId,
        new Date(fechaInicio),
        new Date(fechaFin),
      );
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError)
        return HttpResponse.notFound(res, (e as Error).message);
      next(e);
    }
  };

  getByOrden = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getByOrden(Number(req.params.ordenId));
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };
}
