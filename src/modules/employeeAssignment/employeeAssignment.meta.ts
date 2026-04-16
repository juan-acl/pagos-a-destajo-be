export type AssignmentStatus = "ACTIVO" | "INACTIVO";

export type AssignmentMeta = {
  visibleState: AssignmentStatus;
  empleadoId: number | null;
  asignacionOrdenCuadrillaId: number | null;
};

const STATE_PATTERN = /^(ACTIVO|INACTIVO)(?:\|EMP=(\d+)\|AOC=(\d+))?$/i;

export function normalizeVisibleState(value?: string | null): AssignmentStatus {
  return value?.toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO";
}

export function encodeAssignmentState(
  visibleState: string,
  empleadoId: number,
  asignacionOrdenCuadrillaId: number,
): string {
  return `${normalizeVisibleState(visibleState)}|EMP=${empleadoId}|AOC=${asignacionOrdenCuadrillaId}`;
}

export function parseAssignmentState(raw?: string | null): AssignmentMeta {
  const value = String(raw ?? "ACTIVO").trim();
  const match = value.match(STATE_PATTERN);

  if (!match) {
    return {
      visibleState: normalizeVisibleState(value),
      empleadoId: null,
      asignacionOrdenCuadrillaId: null,
    };
  }

  return {
    visibleState: normalizeVisibleState(match[1]),
    empleadoId: match[2] ? Number(match[2]) : null,
    asignacionOrdenCuadrillaId: match[3] ? Number(match[3]) : null,
  };
}

export function hasAutomaticMetadata(raw?: string | null): boolean {
  const parsed = parseAssignmentState(raw);
  return parsed.empleadoId !== null && parsed.asignacionOrdenCuadrillaId !== null;
}
