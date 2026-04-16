import { In } from "typeorm";
import { LoteProduccion } from "../../entity/productionLot.entity";
import { RevisionProduccion } from "../../entity/productionReview.entity";
import { BadRequestError, NotFoundError } from "../../error/customErrors";
import { AsignacionOrdenCuadrillaRepository } from "../../repository/asignacion-orden-cuadrilla.repository";
import { AsignacionEmpleadoRepository } from "../../repository/employeeAssignment.repository";
import { MiembroCuadrillaRepository } from "../../repository/miembro-cuadrilla.repository";
import { OrdenTrabajoRepository } from "../../repository/orden-trabajo.repository";
import { PlanillaRepository } from "../../repository/pagoPlanilla.repository";
import { LoteProduccionRepository } from "../../repository/productionLot.repository";
import { RevisionProduccionRepository } from "../../repository/productionReview.repository";
import {
  DetalleEmpleado,
  EvidenciaPagoType,
} from "../../shared/paymentMethods";

export class PaymentService {
  private readonly planillaRepo = new PlanillaRepository();
  private readonly loteRepo = new LoteProduccionRepository();
  private readonly revisionRepo = new RevisionProduccionRepository();
  private readonly ordenRepo = new OrdenTrabajoRepository();
  private readonly asignacionRepo = new AsignacionOrdenCuadrillaRepository();
  private readonly asignacionEmpleadoRepo = new AsignacionEmpleadoRepository();
  private readonly miembroCuadrillaRepo = new MiembroCuadrillaRepository();

  private async calcularDetalle(lote: LoteProduccion) {
    const revisiones = await this.revisionRepo.findAll({
      where: {
        estadoRevision: "APROBADO",
      },
      relations: [
        "asignacion",
        "asignacion.cuadrillaId",
      ],
    }) as unknown as RevisionProduccion[];

    if (!revisiones || revisiones.length === 0) {
      return { detalle: [], montoTotal: 0, pagoUnitario: 0 };
    }

    const cuadrillaId = revisiones[0]?.asignacion?.cuadrillaId?.id;
    if (!cuadrillaId) {
      throw new NotFoundError("No se encontró cuadrilla asociada");
    }

    const asignacionOrden = await this.asignacionRepo.findOne({
      where: { cuadrillaId },
    });

    const ordenTrabajo = asignacionOrden
      ? await this.ordenRepo.findOne({
          where: { id: asignacionOrden.ordenTrabajoId },
        })
      : null;

    const pagoUnitario = Number(ordenTrabajo?.pagoUnitario ?? 0);
    const detallePorEmpleado = new Map<number, DetalleEmpleado>();

    for (const rev of revisiones) {
      const empId = rev.asignacion?.id;
      if (!empId) continue;

      const cantidadAprobada = rev.cantidadAprobada ?? 0;
      const monto = cantidadAprobada * pagoUnitario;
      const existente = detallePorEmpleado.get(empId);

      if (existente) {
        existente.cantidadAprobada += cantidadAprobada;
        existente.montoRealizado += monto;
        existente.montoMeta += cantidadAprobada * pagoUnitario;
      } else {
        detallePorEmpleado.set(empId, {
          empleadoId: empId,
          nombreEmpleado: `Empleado ${empId}`,
          metaIndividual: cantidadAprobada,
          cantidadAprobada,
          pagoUnitario,
          montoMeta: monto,
          montoRealizado: monto,
        });
      }
    }

    const detalle = Array.from(detallePorEmpleado.values());
    const montoTotal = detalle.reduce((sum, d) => sum + d.montoRealizado, 0);
    return { detalle, montoTotal, pagoUnitario };
  }
}
