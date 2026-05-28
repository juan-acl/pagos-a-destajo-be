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

    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, "");
    const empleados = await this.repo.findAll();
    const correlativo = String(empleados.length + 1).padStart(3, "0");
    const codigoEmpleado = `EMP-${fechaStr}-${correlativo}`;

    const nuevo = this.repo.create({
      primerNombre: dto.primerNombre,
      segundoNombre: dto.segundoNombre ?? null,
      primerApellido: dto.primerApellido,
      segundoApellido: dto.segundoApellido ?? null,
      email: dto.email,
      password: dto.password,
      codigoEmpleado,
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
      ...(dto.pstPuesto !== undefined && { pstPuesto: dto.pstPuesto }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
    });
  }

  async getPanelEmpleado(empleadoId: number) {
    const miembro = await this.repo.findMiembroCuadrilla(empleadoId);
    if (!miembro) return { miembro: null, asignacion: null, ultimoReporte: null, historial: [], pagos: [], yaReporto: false };

    const asignacion = await this.repo.findAsignacionByCuadrilla(miembro.cuadrillaId);

    const [ultimoReporte, historial, pagos] = await Promise.all([
      asignacion ? this.repo.findUltimoReporte(asignacion.id) : null,
      asignacion ? this.repo.findHistorialReportes(asignacion.id) : [],
      this.repo.findPagosEmpleado(empleadoId),
    ]);

    const yaReporto = ultimoReporte?.estadoRevision === "PENDIENTE_REVISION";

    return { miembro, asignacion, ultimoReporte, historial, pagos, yaReporto };
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, { estado: "INACTIVO" });
  }
}