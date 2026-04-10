import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { OrdenTrabajoService } from "./orden-trabajo.service";
import { CreateOrdenTrabajoDto, UpdateOrdenTrabajoDto } from "./orden-trabajo.dto";

export class OrdenTrabajoController {
  private readonly service = new OrdenTrabajoService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
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
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateOrdenTrabajoDto.parse(req.body);
      const data = await this.service.create(dto);
      HttpResponse.created(res, data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateOrdenTrabajoDto.parse(req.body);
      const data = await this.service.update(Number(req.params.id), dto);
      HttpResponse.ok(res, data, "Actualizado correctamente");
    } catch (e) {
      next(e);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.remove(Number(req.params.id));
      HttpResponse.ok(res, null, "Eliminado correctamente");
    } catch (e) {
      next(e);
    }
  };
}
