import { AsignacionEmpleado } from "../entity/asignacionEmpleado.entity"; 
import { RevisionProduccion } from "../entity/revisionProduccion.entity"; 
import { Empleado } from "../entity/empleado.entity";
import { MiembroCuadrilla } from "../entity/miembro.entity";

export type AssignmentStateMeta = {
  raw: string;
  estadoBase: string;
  asignacionOrdenCuadrillaId: number | null;
  empleadoId: number | null;
};

const AOC_PREFIX = "AOC:";
const EMP_PREFIX = "EMP:";

export function normalizeState(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

export function encodeAssignmentState(
  estadoBase: string,
  asignacionOrdenCuadrillaId?: number | null,
  empleadoId?: number | null,
) {
  const base = normalizeState(estadoBase) || "ACTIVA";
  const parts = [base];

  if (asignacionOrdenCuadrillaId != null) {
    parts.push(`${AOC_PREFIX}${asignacionOrdenCuadrillaId}`);
  }

  if (empleadoId != null) {
    parts.push(`${EMP_PREFIX}${empleadoId}`);
  }

  return parts.join("|");
}

export function parseAssignmentState(value?: string | null): AssignmentStateMeta {
  const raw = String(value ?? "");
  const parts = raw.split("|").map((item) => item.trim()).filter(Boolean);
  const estadoBase = normalizeState(parts[0] ?? raw ?? "ACTIVA") || "ACTIVA";

  let asignacionOrdenCuadrillaId: number | null = null;
  let empleadoId: number | null = null;

  for (const part of parts.slice(1)) {
    const upper = normalizeState(part);
    if (upper.startsWith(AOC_PREFIX)) {
      const value = Number(part.slice(AOC_PREFIX.length));
      asignacionOrdenCuadrillaId = Number.isFinite(value) ? value : null;
    }
    if (upper.startsWith(EMP_PREFIX)) {
      const value = Number(part.slice(EMP_PREFIX.length));
      empleadoId = Number.isFinite(value) ? value : null;
    }
  }

  return { raw, estadoBase, asignacionOrdenCuadrillaId, empleadoId };
}

export function getEmployeeFullName(empleado?: Partial<Empleado> | null) { 
  if (!empleado) return "Empleado sin nombre";

  return [
    empleado.primerNombre,
    empleado.segundoNombre,
    empleado.primerApellido,
    empleado.segundoApellido,
  ]
    .filter((item) => item != null && String(item).trim().length > 0)
    .join(" ")
    .trim();
}

export function getMiembroSortDate(miembro: MiembroCuadrilla) { 
  return miembro.fechaIngreso ? new Date(miembro.fechaIngreso).getTime() : Number.MAX_SAFE_INTEGER;
}

export function getRejectionPercentage(cantidadRecibida: number, cantidadAprobada: number) {
  if (!cantidadRecibida || cantidadRecibida <= 0) return 0;
  return Number((((cantidadRecibida - cantidadAprobada) / cantidadRecibida) * 100).toFixed(2));
}

export function enrichAssignment(
  assignment: AsignacionEmpleado,
  options?: {
    empleado?: Empleado | null; 
    cuadrilla?: { id: number; nombre?: string; codigoCuadrilla?: string | null } | null;
    asignacionOrdenCuadrilla?: { id: number; ordenTrabajoId: number; cantidadAsignada: number; estado?: string } | null;
    approvedTotal?: number;
    hasAnyReview?: boolean;
  },
) {
  const meta = parseAssignmentState(assignment.estado);
  const approvedTotal = options?.approvedTotal ?? 0;
  const orderAssignment = options?.asignacionOrdenCuadrilla ?? null;

  return {
    ...assignment,
    estado: meta.estadoBase,
    estadoRaw: assignment.estado,
    empleadoId: meta.empleadoId,
    empleadoNombre: getEmployeeFullName(options?.empleado),
    asignacionOrdenCuadrillaId: meta.asignacionOrdenCuadrillaId,
    ordenTrabajoId: orderAssignment?.ordenTrabajoId ?? null,
    cantidadAsignadaCuadrilla: orderAssignment?.cantidadAsignada ?? null,
    cantidadAprobadaAcumulada: approvedTotal,
    cantidadPendiente: Math.max(assignment.metaIndividual - approvedTotal, 0),
    puedeEditar: !options?.hasAnyReview,
    cuadrilla: options?.cuadrilla ?? null,
  };
}

export function enrichReview(
  review: RevisionProduccion,
  options?: {
    assignment?: ReturnType<typeof enrichAssignment> | null;
  },
) {
  const porcentajeRechazo = getRejectionPercentage(
    review.cantidadRecibida,
    review.cantidadAprobada,
  );

  const assignment = options?.assignment ?? null;

  return {
    ...review,
    estadoRevision: normalizeState(review.estadoRevision),
    porcentajeRechazo,
    assignment,
    asignacion: assignment,
  };
}