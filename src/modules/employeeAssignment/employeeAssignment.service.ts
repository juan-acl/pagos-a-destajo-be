import { IsNull } from "typeorm";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { CuadrillaRepository } from "../../repository/cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { normalizeState } from "../../shared/temporal-flow";
import {
  CreateEmployeeAssignmentDtoType,
  DistributeEmployeeAssignmentsDtoType,
  SetPaymentModalityDtoType,
  UpdateEmployeeAssignmentDtoType,
} from "./employeeAssignment.dto";

type ControlMeta = {
  base: string;
  aocId: number | null;
  fecha: string | null;
};

const DEST_STATE = "MOD_DEST";
const DAY_VALID_STATE = "DIA_VAL";
const DAY_PENDING_STATE = "DIA_PEND";
const VALID_ORDER_STATES = new Set(["EN_PROCESO", "ACTIVO"]);

function dateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function compactDate(date: Date) {
  return dateOnly(date).replace(/-/g, "");
}

function parseCompactDate(value: string) {
  if (!/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function eachDateInclusive(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const limit = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= limit) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function parseControlState(value?: string | null): ControlMeta {
  const rawParts = String(value ?? "").split("|").map((item) => item.trim()).filter(Boolean);
  const base = normalizeState(rawParts[0] ?? "");
  let aocId: number | null = null;
  let fecha: string | null = null;

  for (const part of rawParts.slice(1)) {
    const upper = normalizeState(part);
    if (upper.startsWith("AOC:")) {
      const id = Number(part.slice(4));
      aocId = Number.isFinite(id) ? id : null;
    }
    if (upper.startsWith("F:")) {
      fecha = parseCompactDate(part.slice(2));
    }
  }

  return { base, aocId, fecha };
}

function encodeControlState(base: string, aocId: number, date?: Date) {
  const parts = [base, `AOC:${aocId}`];
  if (date) parts.push(`F:${compactDate(date)}`);
  return parts.join("|");
}

export class EmployeeAssignmentService {
  private readonly repo = new AsignacionEmpleadoRepository();
  private readonly orderAssignmentRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly cuadrillaRepo = new CuadrillaRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly miembroRepo = new MiembroCuadrillaRepository();

  private async getActiveRawRows() {
    return this.repo.findAll({
      where: { fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true },
      order: { id: "DESC" as any },
    });
  }

  private async getOrderAssignmentOrFail(id: number) {
    const aoc = await this.orderAssignmentRepo.findById(id);
    if (!aoc || aoc.fechaEliminacion) {
      throw new NotFoundError("La asignación de orden a cuadrilla no existe.");
    }

    const [orden, cuadrilla] = await Promise.all([
      this.ordenRepo.findById(aoc.ordenTrabajoId),
      this.cuadrillaRepo.findById(aoc.cuadrillaId),
    ]);

    if (!orden || orden.fechaEliminacion) {
      throw new BadRequestError("La orden de trabajo asociada no existe.");
    }

    if (!cuadrilla || cuadrilla.deletedAt) {
      throw new BadRequestError("La cuadrilla asociada no existe.");
    }

    return { aoc, orden, cuadrilla };
  }

  private assertJefe(role?: string | string[] | null) {
    const value = Array.isArray(role) ? role[0] : role;
    const normalized = normalizeState(value ?? "JEFE");
    if (normalized !== "JEFE") {
      throw new BadRequestError("Solo un usuario con rol JEFE puede registrar la modalidad de pago.");
    }
  }

  private assertOrderCanReceiveModality(orderState: string) {
    const normalized = normalizeState(orderState);
    if (!VALID_ORDER_STATES.has(normalized)) {
      throw new BadRequestError("Solo se puede registrar modalidad sobre órdenes EN_PROCESO o ACTIVAS.");
    }
  }

  private async softDeleteControlsByAoc(aocId: number) {
    const rows = await this.getActiveRawRows();
    const targetRows = rows.filter((row) => parseControlState(row.estado).aocId === aocId);
    await Promise.all(
      targetRows.map((row) => this.repo.update(row.id, { fecha_eliminacion: new Date() } as any)),
    );
  }

  private async getMiembrosActivos(cuadrillaId: number) {
    return this.miembroRepo.findByCuadrilla(cuadrillaId);
  }

  private buildControlSummary(rows: any[]) {
    const today = dateOnly(new Date());
    const controlRows = rows.map((row) => {
      const meta = parseControlState(row.estado);
      const isDay = meta.base === DAY_VALID_STATE || meta.base === DAY_PENDING_STATE;
      const vigente = isDay ? Boolean(meta.fecha && meta.fecha <= today) : true;
      return {
        id: row.id,
        estadoRaw: row.estado,
        base: meta.base,
        aocId: meta.aocId,
        fecha: meta.fecha,
        vigente,
        monto: Number(row.metaIndividual ?? 0),
        cuadrilla: row.cuadrillaId ?? null,
      };
    });

    const destajo = controlRows.find((row) => row.base === DEST_STATE) ?? null;
    const dias = controlRows
      .filter((row) => row.base === DAY_VALID_STATE || row.base === DAY_PENDING_STATE)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    if (destajo) {
      return {
        modalidad: "DESTAJO",
        cantidadReferencia: destajo.monto,
        pagoUnitario: null,
        montoDiario: null,
        varianteDias: null,
        fechaInicio: null,
        fechaFin: null,
        diasSeleccionados: 0,
        diasVigentes: 0,
        diasPendientes: 0,
        montoTotalProyectado: 0,
        montoPagableActual: 0,
        controles: controlRows,
      };
    }

    if (dias.length) {
      const diasVigentes = dias.filter((day) => day.vigente).length;
      const montoDiario = dias[0]?.monto ?? 0;
      return {
        modalidad: "PAGO_POR_DIAS",
        cantidadReferencia: null,
        pagoUnitario: null,
        montoDiario,
        varianteDias: dias.some((day) => !day.vigente) ? "DIAS_FUTUROS" : "DIAS_VENCIDOS",
        fechaInicio: dias[0]?.fecha ?? null,
        fechaFin: dias[dias.length - 1]?.fecha ?? null,
        diasSeleccionados: dias.length,
        diasVigentes,
        diasPendientes: dias.length - diasVigentes,
        montoTotalProyectado: dias.length * montoDiario,
        montoPagableActual: diasVigentes * montoDiario,
        controles: controlRows,
      };
    }

    return {
      modalidad: null,
      cantidadReferencia: null,
      pagoUnitario: null,
      montoDiario: null,
      varianteDias: null,
      fechaInicio: null,
      fechaFin: null,
      diasSeleccionados: 0,
      diasVigentes: 0,
      diasPendientes: 0,
      montoTotalProyectado: 0,
      montoPagableActual: 0,
      controles: controlRows,
    };
  }

  async getPanels() {
    const [aocs, orders, cuadrillas, rows] = await Promise.all([
      this.orderAssignmentRepo.findAll({
        where: { fechaEliminacion: IsNull() } as any,
        order: { id: "DESC" as any },
      }),
      this.ordenRepo.findAll({ where: { fechaEliminacion: IsNull() } as any }),
      this.cuadrillaRepo.findAll({ where: { deletedAt: IsNull() } as any }),
      this.getActiveRawRows(),
    ]);

    const orderMap = new Map(orders.map((item) => [item.id, item]));
    const cuadrillaMap = new Map(cuadrillas.map((item) => [item.id, item]));

    return Promise.all(
      aocs.map(async (aoc) => {
        const orden = orderMap.get(aoc.ordenTrabajoId) ?? null;
        const cuadrilla = cuadrillaMap.get(aoc.cuadrillaId) ?? null;
        const controlRows = rows.filter((row) => parseControlState(row.estado).aocId === aoc.id);
        const miembros = await this.getMiembrosActivos(aoc.cuadrillaId);
        const summary = this.buildControlSummary(controlRows);

        return {
          id: aoc.id,
          estado: normalizeState(aoc.estado),
          cantidadAsignada: Number(aoc.cantidadAsignada ?? 0),
          orden,
          cuadrilla,
          miembrosActivos: miembros.length,
          ordenHabilitada: orden ? VALID_ORDER_STATES.has(normalizeState(orden.estado)) : false,
          blockedReason: orden && !VALID_ORDER_STATES.has(normalizeState(orden.estado))
            ? "La orden no está EN_PROCESO/ACTIVA."
            : null,
          ...summary,
          pagoUnitario: orden ? Number(orden.pagoUnitario ?? 0) : 0,
        };
      }),
    );
  }

  async setPaymentModality(dto: SetPaymentModalityDtoType, role?: string | string[] | null) {
    this.assertJefe(role);

    const { aoc, orden } = await this.getOrderAssignmentOrFail(dto.asignacionOrdenCuadrillaId);
    this.assertOrderCanReceiveModality(orden.estado);

    await this.softDeleteControlsByAoc(aoc.id);

    const modalidad = dto.modalidad === "DESTAJ0" ? "DESTAJO" : dto.modalidad;

    if (modalidad === "DESTAJO") {
      const saved = await this.repo.save(
        this.repo.create({
          metaIndividual: Number(aoc.cantidadAsignada ?? 0),
          estado: encodeControlState(DEST_STATE, aoc.id),
          cuadrillaId: { id: aoc.cuadrillaId } as any,
        }),
      );

      return {
        modalidad: "DESTAJO",
        asignacionOrdenCuadrillaId: aoc.id,
        cantidadReferencia: Number(aoc.cantidadAsignada ?? 0),
        pagoUnitario: Number(orden.pagoUnitario ?? 0),
        controlId: saved.id,
      };
    }

    const montoDiario = Number(dto.montoDiario ?? 0);
    const fechaInicio = dto.fechaInicio!;
    const fechaFin = dto.fechaFin!;
    const variante = dto.varianteDias === "PROGRAMADOS" ? "DIAS_FUTUROS" : dto.varianteDias;
    const today = dateOnly(new Date());
    const fechas = eachDateInclusive(fechaInicio, fechaFin);

    if (variante === "DIAS_VENCIDOS" && fechas.some((fecha) => dateOnly(fecha) > today)) {
      throw new BadRequestError("Para DIAS_VENCIDOS todas las fechas deben ser pasadas o la fecha actual.");
    }

    if (variante === "DIAS_FUTUROS" && dateOnly(fechaFin) < today) {
      throw new BadRequestError("Para DIAS_FUTUROS la fecha final debe ser actual o futura.");
    }

    const createdIds: number[] = [];
    for (const fecha of fechas) {
      const vigente = dateOnly(fecha) <= today;
      const state = variante === "DIAS_VENCIDOS" || vigente ? DAY_VALID_STATE : DAY_PENDING_STATE;
      const saved = await this.repo.save(
        this.repo.create({
          metaIndividual: montoDiario,
          estado: encodeControlState(state, aoc.id, fecha),
          cuadrillaId: { id: aoc.cuadrillaId } as any,
        }),
      );
      createdIds.push(saved.id);
    }

    const diasVigentes = fechas.filter((fecha) => dateOnly(fecha) <= today).length;

    return {
      modalidad: "PAGO_POR_DIAS",
      varianteDias: variante,
      asignacionOrdenCuadrillaId: aoc.id,
      montoDiario,
      fechaInicio: dateOnly(fechaInicio),
      fechaFin: dateOnly(fechaFin),
      diasSeleccionados: fechas.length,
      diasVigentes,
      diasPendientes: fechas.length - diasVigentes,
      montoTotalProyectado: fechas.length * montoDiario,
      montoPagableActual: diasVigentes * montoDiario,
      controlIds: createdIds,
    };
  }

  async distribute(_dto: DistributeEmployeeAssignmentsDtoType) {
    throw new BadRequestError(
      "La distribución de metas individuales fue deshabilitada. Use el registro de modalidad de pago.",
    );
  }

  async getById(id: number) {
    const row = await this.repo.findOne({
      where: { id, fecha_eliminacion: IsNull() } as any,
      relations: { cuadrillaId: true },
    });

    if (!row) {
      throw new NotFoundError("Registro de modalidad/asignación no encontrado");
    }

    const meta = parseControlState(row.estado);
    return {
      ...row,
      estado: meta.base || normalizeState(row.estado),
      asignacionOrdenCuadrillaId: meta.aocId,
      fechaControl: meta.fecha,
      modalidad: meta.base === DEST_STATE ? "DESTAJO" : meta.base ? "PAGO_POR_DIAS" : null,
    };
  }

  async create(dto: CreateEmployeeAssignmentDtoType) {
    const newAssignment = this.repo.create({
      metaIndividual: dto.metaIndividual,
      estado: normalizeState(dto.estado),
      cuadrillaId: { id: dto.cuadrillaId } as any,
    });

    const saved = await this.repo.save(newAssignment);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateEmployeeAssignmentDtoType) {
    await this.getById(id);
    await this.repo.update(id, {
      ...(dto.metaIndividual !== undefined && { metaIndividual: dto.metaIndividual }),
      ...(dto.estado !== undefined && { estado: normalizeState(dto.estado) }),
      ...(dto.cuadrillaId !== undefined && { cuadrillaId: { id: dto.cuadrillaId } as any }),
    } as any);

    return this.getById(id);
  }

  async remove(id: number) {
    await this.getById(id);
    return this.repo.update(id, { fecha_eliminacion: new Date() } as any);
  }

  async getAll() {
    const rows = await this.getActiveRawRows();
    return rows.map((row) => {
      const meta = parseControlState(row.estado);
      const today = dateOnly(new Date());
      const isDay = meta.base === DAY_VALID_STATE || meta.base === DAY_PENDING_STATE;
      return {
        ...row,
        estado: meta.base || normalizeState(row.estado),
        asignacionOrdenCuadrillaId: meta.aocId,
        fechaControl: meta.fecha,
        modalidad: meta.base === DEST_STATE ? "DESTAJO" : isDay ? "PAGO_POR_DIAS" : null,
        vigente: isDay ? Boolean(meta.fecha && meta.fecha <= today) : true,
      };
    });
  }
}
