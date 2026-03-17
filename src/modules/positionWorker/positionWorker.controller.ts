import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { PositionWorkerService } from "./positionWorker.service";
import { CreatePositionWorkerDto, UpdatePositionWorkerDto } from "./positionWorker.dto";
import { NotFoundError } from "../../error/customErrors";

export class PositionWorkerController {
  private readonly service = new PositionWorkerService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll()
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
      if(e instanceof NotFoundError) return HttpResponse.notFound(res, "Verifique el identificador de la busqueda")
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreatePositionWorkerDto.parse(req.body);
      const data = await this.service.create(dto);
      HttpResponse.created(res, data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdatePositionWorkerDto.parse(req.body);
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
