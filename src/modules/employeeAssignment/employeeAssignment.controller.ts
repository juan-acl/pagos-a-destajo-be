import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { NotFoundError } from "../../error/customErrors";
import { EmployeeAssignmentService } from "./employeeAssignment.service";
import {
  CreateEmployeeAssignmentDto,
  DistributeEmployeeAssignmentsDto,
  SetPaymentModalityDto,
  UpdateEmployeeAssignmentDto,
} from "./employeeAssignment.dto";

export class EmployeeAssignmentController {
  private readonly service = new EmployeeAssignmentService();

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };

  getPanels = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPanels();
      HttpResponse.ok(res, data);
    } catch (e) {
      next(e);
    }
  };


  setModality = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = SetPaymentModalityDto.parse(req.body);
      const data = await this.service.setPaymentModality(dto, req.headers["x-user-role"] as any);
      HttpResponse.created(res, data, "Modalidad de pago registrada correctamente");
    } catch (e) {
      next(e);
    }
  };

  distribute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = DistributeEmployeeAssignmentsDto.parse(req.body);
      const data = await this.service.distribute(dto);
      HttpResponse.created(res, data, "Metas distribuidas correctamente");
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(Number(req.params.id));
      HttpResponse.ok(res, data);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return HttpResponse.notFound(res, "Verifique el identificador de la búsqueda");
      }
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateEmployeeAssignmentDto.parse(req.body);
      const data = await this.service.create(dto);
      HttpResponse.created(res, data);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateEmployeeAssignmentDto.parse(req.body);
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
