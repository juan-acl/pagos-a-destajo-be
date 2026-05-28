import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { Empleado } from "../entity/empleado.entity";
import { MiembroCuadrilla } from "../entity/miembro.entity";
import { AsignacionOrdenCuadrilla } from "../entity/asignacionCuadrilla.entity";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";

export class EmpleadoRepository extends BaseRepository<Empleado> {
  constructor() {
    super(AppDataSource.getRepository(Empleado));
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findMiembroCuadrilla(empleadoId: number) {
    return AppDataSource.getRepository(MiembroCuadrilla).findOne({
      where: { empleadoId, estado: "ACTIVO" },
    });
  }

  findOrdenActiva(cuadrillaId: number) {
    return AppDataSource.getRepository(AsignacionOrdenCuadrilla).findOne({
      where: { cuadrillaId, estado: "ACTIVO" },
      order: { id: "DESC" } as any,
    });
  }

  findOrdenTrabajo(ordenTrabajoId: number) {
    return AppDataSource.getRepository(OrdenTrabajoEntity).findOne({
      where: { id: ordenTrabajoId },
    });
  }

  async findAsignacionEmpleadoActiva(asignacionOrdenId: number, empleadoId: number, cuadrillaId: number) {
    const rows = await AppDataSource.query(`
      SELECT ASE_ID as "id"
      FROM DES_ASIGNACION_EMPLEADO
      WHERE ASE_CUADRILLA_ID = :1
        AND ASE_FECHA_ELIMINACION IS NULL
        AND (ASE_ESTADO LIKE :2 OR ASE_ESTADO LIKE :3)
        AND (ASE_ESTADO LIKE :4 OR ASE_ESTADO LIKE :5)
        AND (ASE_ESTADO LIKE 'ACTIVA%' OR ASE_ESTADO LIKE 'ACTIVO%')
      ORDER BY ASE_ID DESC
    `, [
      cuadrillaId,
      `%AOC:${asignacionOrdenId}%`,
      `%AOC=${asignacionOrdenId}%`,
      `%EMP:${empleadoId}%`,
      `%EMP=${empleadoId}%`,
    ]);

    return rows?.[0] ?? null;
  }

  async findHistorialReportes(asignacionOrdenId: number, empleadoId: number, cuadrillaId: number) {
    return AppDataSource.query(`
      SELECT
        r.RVP_ID as "id",
        r.RVP_CANTIDAD_RECIBIDA as "cantidadRecibida",
        r.RVP_CANTIDAD_APROBADA as "cantidadAprobada",
        r.RVP_ESTADO_REVISION as "estadoRevision",
        r.RVP_OBSERVACIONES as "observaciones",
        r.RVP_FECHA_REVISION as "fechaRevision",
        r.RVP_FECHA_CREACION as "fecha_creacion"
      FROM DES_REVISION_PRODUCCION r
      JOIN DES_ASIGNACION_EMPLEADO a ON r.RVP_ASIGNACION_EMPLEADO_ID = a.ASE_ID
      WHERE a.ASE_CUADRILLA_ID = :1
        AND r.RVP_FECHA_ELIMINACION IS NULL
        AND (a.ASE_ESTADO LIKE :2 OR a.ASE_ESTADO LIKE :3)
        AND (a.ASE_ESTADO LIKE :4 OR a.ASE_ESTADO LIKE :5)
      ORDER BY r.RVP_FECHA_CREACION DESC
    `, [
      cuadrillaId,
      `%AOC:${asignacionOrdenId}%`,
      `%AOC=${asignacionOrdenId}%`,
      `%EMP:${empleadoId}%`,
      `%EMP=${empleadoId}%`,
    ]);
  }

  async findUltimoReporte(asignacionOrdenId: number, empleadoId: number, cuadrillaId: number) {
    const rows = await this.findHistorialReportes(asignacionOrdenId, empleadoId, cuadrillaId);
    return rows?.[0] ?? null;
  }

  async findPagosEmpleado(empleadoId: number) {
    return AppDataSource.query(`
      SELECT 
        p.PGP_ID as "id",
        p.PGP_NUMERO_PAGO as "numeroPago",
        p.PGP_MONTO_TOTAL as "montoTotal",
        p.PGP_ESTADO as "estado",
        p.PGP_FECHA_PAGO as "fechaPago",
        p.PGP_METODO_PAGO as "metodoPago",
        l.LTP_NUMERO_LOTE as "numeroLote",
        r.RVP_CANTIDAD_APROBADA as "cantidadAprobada"
      FROM DES_PLANILLA p
      JOIN DES_LOTE_PRODUCCION l ON p.PGP_LOTE_PRODUCCION_ID = l.LTP_ID
      JOIN DES_REVISION_PRODUCCION r ON l.LTP_REVISION_PRODUCCION_ID = r.RVP_ID
      JOIN DES_ASIGNACION_EMPLEADO a ON r.RVP_ASIGNACION_EMPLEADO_ID = a.ASE_ID
      WHERE (a.ASE_ESTADO LIKE :1 OR a.ASE_ESTADO LIKE :2)
      ORDER BY p.PGP_FECHA_PAGO DESC
    `, [`%EMP:${empleadoId}%`, `%EMP=${empleadoId}%`]);
  }

  async createReporteOperario(data: {
    cantidadRecibida: number;
    cantidadAprobada: number;
    estadoRevision: string;
    fechaRevision: Date;
    cuadrillaId: number;
    empleadoId: number;
    asignacionOrdenId: number;
  }) {
    const asignacion = await this.findAsignacionEmpleadoActiva(
      data.asignacionOrdenId,
      data.empleadoId,
      data.cuadrillaId,
    );

    if (!asignacion) {
      throw new Error("No existe una asignación activa para este empleado en la orden. Sincroniza empleados desde Asignaciones.");
    }

    await AppDataSource.query(`
      INSERT INTO DES_REVISION_PRODUCCION (
        RVP_CANTIDAD_RECIBIDA, RVP_CANTIDAD_APROBADA,
        RVP_ESTADO_REVISION, RVP_FECHA_REVISION,
        RVP_ASIGNACION_EMPLEADO_ID,
        RVP_FECHA_CREACION, RVP_FECHA_ACTUALIZACION
      ) VALUES (
        :1, :2, :3, :4, :5, SYSTIMESTAMP, SYSTIMESTAMP
      )
    `, [
      data.cantidadRecibida,
      data.cantidadAprobada,
      data.estadoRevision,
      data.fechaRevision,
      asignacion.id,
    ]);

    return { asignacionEmpleadoId: asignacion.id, estadoRevision: data.estadoRevision };
  }
}