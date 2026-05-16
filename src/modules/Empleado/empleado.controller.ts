import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { NotFoundError } from "../../error/customErrors";
import { EmpleadoService } from "./empleado.service";
import { CreateEmpleadoDto, UpdateEmpleadoDto } from "./empleado.dto";

export class EmpleadoController {
    private readonly service = new EmpleadoService();

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.getAll();
            HttpResponse.ok(res, data);
        } catch (e) { next(e); }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.getById(Number(req.params.id));
            HttpResponse.ok(res, data);
        } catch (e) {
            if (e instanceof NotFoundError) return HttpResponse.notFound(res, "Verifique el identificador de la búsqueda");
            next(e);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = CreateEmpleadoDto.parse(req.body);
            const data = await this.service.create(dto);
            HttpResponse.created(res, data);
        } catch (e) { next(e); }
    };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateEmpleadoDto.parse(req.body);
      const data = await this.service.create(dto);
      HttpResponse.created(res, data);
    } catch (e) { next(e); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateEmpleadoDto.parse(req.body);
      const data = await this.service.update(Number(req.params.id), dto);
      HttpResponse.ok(res, data, "Actualizado correctamente");
    } catch (e) { next(e); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(Number(req.params.id));
      HttpResponse.ok(res, null, "Eliminado correctamente");
    } catch (e) { next(e); }
  };

  getPanelEmpleado = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPanelEmpleado(Number(req.params.id));
      HttpResponse.ok(res, data);
    } catch (e) { next(e); }
  };

  createReporteOperario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const empleadoId = Number(req.params.id);
      const { cantidadRecibida, reportadorId } = req.body;

      // Validar que el empleado solo reporte por sí mismo
      if (reportadorId && Number(reportadorId) !== empleadoId) {
        return res.status(403).json({
          success: false,
          message: "No puedes registrar producción a nombre de otro empleado."
        });
      }

      const data = await this.service.createReporteOperario(empleadoId, Number(cantidadRecibida));
      HttpResponse.created(res, data, "Reporte registrado correctamente");
    } catch (e: any) {
      if (e instanceof NotFoundError) return HttpResponse.notFound(res, e.message);
      res.status(400).json({ success: false, message: e.message });
    }
  };
}