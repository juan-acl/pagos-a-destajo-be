import { NotFoundError } from "../../error/customErrors";
import { EmpleadoRepository } from "../../repository/empleado.repository";
import { CreateEmpleadoDtoType, UpdateEmpleadoDtoType, LoginDtoType } from "./empleado.dto";

export class EmpleadoService {
  private readonly repo = new EmpleadoRepository();

  async getAll() {
    return this.repo.findAll();
  }

  async getById(id: number) {
    const empleado = await this.repo.findById(id);
    if (!empleado) throw new NotFoundError("Empleado no encontrado");
    return empleado;
  }

  async login(dto: LoginDtoType) {
    const empleado = await this.repo.findByEmail(dto.email);
    if (!empleado) throw new NotFoundError("Credenciales incorrectas");
    if (empleado.password !== dto.password) throw new Error("Credenciales incorrectas");
    if (empleado.estado !== "ACTIVO") throw new Error("Empleado inactivo");
    const { password, ...rest } = empleado;
    return rest;
  }

  async create(dto: CreateEmpleadoDtoType) {
    const existe = await this.repo.findByEmail(dto.email);
    if (existe) throw new Error("El email ya está registrado");
    const nuevo = this.repo.create({
      primerNombre: dto.primerNombre,
      segundoNombre: dto.segundoNombre ?? null,
      primerApellido: dto.primerApellido,
      segundoApellido: dto.segundoApellido ?? null,
      email: dto.email,
      password: dto.password,
      codigoEmpleado: dto.codigoEmpleado ?? null,
      pstPuesto: dto.pstPuesto ?? null,
      estado: dto.estado ?? "ACTIVO",
    });
    return this.repo.save(nuevo);
  }

  async update(id: number, dto: UpdateEmpleadoDtoType) {
    await this.getById(id);
    return this.repo.update(id, {
      ...(dto.primerNombre !== undefined && { primerNombre: dto.primerNombre }),
      ...(dto.segundoNombre !== undefined && { segundoNombre: dto.segundoNombre }),
      ...(dto.primerApellido !== undefined && { primerApellido: dto.primerApellido }),
      ...(dto.segundoApellido !== undefined && { segundoApellido: dto.segundoApellido }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.password !== undefined && dto.password !== "" && { password: dto.password }),
      ...(dto.codigoEmpleado !== undefined && { codigoEmpleado: dto.codigoEmpleado }),
      ...(dto.pstPuesto !== undefined && { pstPuesto: dto.pstPuesto }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, { estado: "INACTIVO" });
  }

  async getPanelEmpleado(empleadoId: number): Promise<any> {
    const miembro = await this.repo.findMiembroCuadrilla(empleadoId);
    if (!miembro) return {
      miembro: null, asignacionOrden: null, ordenTrabajo: null,
      ultimoReporte: null, historial: [], pagos: [], yaReporto: false
    };

    const asignacionOrden = await this.repo.findOrdenActiva(miembro.cuadrillaId);
    if (!asignacionOrden) return {
      miembro, asignacionOrden: null, ordenTrabajo: null,
      ultimoReporte: null, historial: [], pagos: [], yaReporto: false
    };

    const ordenTrabajo = await this.repo.findOrdenTrabajo(asignacionOrden.ordenTrabajoId);

    if (!ordenTrabajo || ordenTrabajo.estado !== "EN_PROCESO" || ordenTrabajo.modalidad !== "DESTAJO") {
      return {
        miembro, asignacionOrden, ordenTrabajo,
        ultimoReporte: null, historial: [], pagos: [], yaReporto: false,
        ordenInvalida: true
      };
    }

    const [ultimoReporte, historial, pagos] = await Promise.all([
      this.repo.findUltimoReporte(asignacionOrden.id),
      this.repo.findHistorialReportes(asignacionOrden.id),
      this.repo.findPagosEmpleado(empleadoId),
    ]);

    const yaReporto = ultimoReporte?.estadoRevision === "PENDIENTE_REVISION";

    return { miembro, asignacionOrden, ordenTrabajo, ultimoReporte, historial, pagos, yaReporto };
  }

  async createReporteOperario(empleadoId: number, cantidadRecibida: number): Promise<any> {
    if (!cantidadRecibida || cantidadRecibida <= 0) {
      throw new Error("La cantidad debe ser mayor a cero.");
    }

    if (cantidadRecibida > 9999) {
      throw new Error("La cantidad parece incorrecta. Verifica el dato ingresado.");
    }

    const miembro = await this.repo.findMiembroCuadrilla(empleadoId);
    if (!miembro) throw new Error("El empleado no pertenece a ninguna cuadrilla activa.");

    const asignacionOrden = await this.repo.findOrdenActiva(miembro.cuadrillaId);
    if (!asignacionOrden) throw new Error("No tienes una orden activa asignada.");

    const ordenTrabajo = await this.repo.findOrdenTrabajo(asignacionOrden.ordenTrabajoId);
    if (!ordenTrabajo) throw new Error("Orden de trabajo no encontrada.");

    if (ordenTrabajo.estado !== "EN_PROCESO") {
      throw new Error("La orden no está en proceso. No puedes reportar en este momento.");
    }

    if (ordenTrabajo.modalidad !== "DESTAJO") {
      throw new Error("Esta orden no es de modalidad DESTAJO.");
    }
return this.repo.createReporteOperario({
  cantidadRecibida,
  cantidadAprobada: 0,
  estadoRevision: "PENDIENTE_REVISION",
  fechaRevision: new Date(),
  cuadrillaId: miembro.cuadrillaId,
});
  }
}