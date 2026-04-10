import { AppDataSource } from "../config/data-source";
import { BaseRepository } from "../shared/base.repository";
import { EmpleadoEntity } from "../entity/empleado.entity";
import { MiembroCuadrillaEntity } from "../entity/miembro-cuadrilla.entity";
import { AsignacionEmpleado } from "../entity/employeeAssignment.entity";
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

  findAsignacionByCuadrilla(cuadrillaId: number) {
    return AppDataSource.getRepository(AsignacionEmpleado).findOne({
      where: { cuadrillaId, estado: "ACTIVO" },
    });
  }

  findUltimoReporte(asignacionEmpleadoId: number) {
    return AppDataSource.getRepository(RevisionProduccion).findOne({
      where: { asignacionEmpleadoId },
      order: { createdAt: "DESC" },
    });
  }

  findHistorialReportes(asignacionEmpleadoId: number) {
    return AppDataSource.getRepository(RevisionProduccion).find({
      where: { asignacionEmpleadoId },
      order: { createdAt: "DESC" },
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
        r.RVP_CANTIDAD_APROBADA as "cantidadAprobada",
        a.ASE_META_INDIVIDUAL as "metaIndividual"
      FROM DES_PLANILLA p
      JOIN DES_LOTE_PRODUCCION l ON p.PGP_LOTE_PRODUCCION_ID = l.LTP_ID
      JOIN DES_REVISION_PRODUCCION r ON l.LTP_REVISION_PRODUCCION_ID = r.RVP_ID
      JOIN DES_ASIGNACION_EMPLEADO a ON r.RVP_ASIGNACION_EMPLEADO_ID = a.ASE_ID
      JOIN DES_MIEMBRO_CUADRILLA mc ON a.ASE_CUADRILLA_ID = mc.MIC_CUADRILLA_ID
      WHERE mc.MIC_EMPLEADO_ID = :1
      ORDER BY p.PGP_FECHA_PAGO DESC
    `, [empleadoId]);
  }
}