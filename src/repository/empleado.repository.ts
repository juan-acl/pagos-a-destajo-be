import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { EmpleadoEntity } from "../entity/empleado.entity";
import { MiembroCuadrillaEntity } from "../entity/miembro-cuadrilla.entity";
import { AsignacionOrdenCuadrillaEntity } from "../entity/asignacion-orden-cuadrilla.entity";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";
import { RevisionProduccion } from "../entity/productionReview.entity";

export class EmpleadoRepository extends BaseRepository<EmpleadoEntity> {
  constructor() {
    super(AppDataSource.getRepository(EmpleadoEntity));
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findMiembroCuadrilla(empleadoId: number) {
    return AppDataSource.getRepository(MiembroCuadrillaEntity).findOne({
      where: { empleadoId, estado: "ACTIVO" },
    });
  }

  findOrdenActiva(cuadrillaId: number) {
    return AppDataSource.getRepository(AsignacionOrdenCuadrillaEntity).findOne({
      where: { cuadrillaId, estado: "ACTIVO" },
    });
  }

  findOrdenTrabajo(ordenTrabajoId: number) {
    return AppDataSource.getRepository(OrdenTrabajoEntity).findOne({
      where: { id: ordenTrabajoId },
    });
  }

  findHistorialReportes(asignacionOrdenId: number) {
    return AppDataSource.getRepository(RevisionProduccion).find({
      where: { asignacion: { id: asignacionOrdenId } } as any,
      order: { fecha_creacion: "DESC" } as any,
    });
  }

  findUltimoReporte(asignacionOrdenId: number) {
    return AppDataSource.getRepository(RevisionProduccion).findOne({
      where: { asignacion: { id: asignacionOrdenId } } as any,
      order: { fecha_creacion: "DESC" } as any,
    });
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
      JOIN DES_MIEMBRO_CUADRILLA mc ON a.ASE_CUADRILLA_ID = mc.MIC_CUADRILLA_ID
      WHERE mc.MIC_EMPLEADO_ID = :1
      ORDER BY p.PGP_FECHA_PAGO DESC
    `, [empleadoId]);
  }

async createReporteOperario(data: {
  cantidadRecibida: number;
  cantidadAprobada: number;
  estadoRevision: string;
  fechaRevision: Date;
  cuadrillaId: number;
}) {
  // Buscar asignacion de empleado por cuadrillaId
  const asignacion = await AppDataSource.query(`
    SELECT ASE_ID FROM DES_ASIGNACION_EMPLEADO 
    WHERE ASE_CUADRILLA_ID = :1 
    AND ASE_ESTADO = 'ACTIVO'
    AND ROWNUM = 1
  `, [data.cuadrillaId]);

  if (!asignacion || asignacion.length === 0) {
    throw new Error("No existe una asignación de empleado activa para esta cuadrilla.");
  }

  const asignacionEmpleadoId = asignacion[0].ASE_ID;

  return AppDataSource.query(`
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
    asignacionEmpleadoId,
  ]);
}

}