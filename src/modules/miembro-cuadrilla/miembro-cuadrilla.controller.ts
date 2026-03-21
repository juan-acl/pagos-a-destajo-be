import { Request, Response, NextFunction } from "express";
import { HttpResponse } from "../../shared/http-response";
import { NotFoundError } from "../../error/customErrors";
import { MiembroCuadrillaService } from "./miembro-cuadrilla.service";
import { CreateMiembroDto, UpdateMiembroDto } from "./miembro-cuadrilla.dto";

export class MiembroCuadrillaController {
    private readonly service = new MiembroCuadrillaService();

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

    getByCuadrilla = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.getByCuadrilla(Number(req.params.cuadrillaId));
            HttpResponse.ok(res, data);
        } catch (e) { next(e); }
    };

    getByEmpleado = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.service.getByEmpleado(Number(req.params.empleadoId));
            HttpResponse.ok(res, data);
        } catch (e) { next(e); }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = CreateMiembroDto.parse(req.body);
            const data = await this.service.create(dto);
            HttpResponse.created(res, data);
        } catch (e) { next(e); }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = UpdateMiembroDto.parse(req.body);
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
}