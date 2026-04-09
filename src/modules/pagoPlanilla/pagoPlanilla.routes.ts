import { Router } from "express";
import { PaymentController } from "./pagoPlanilla.controller";

const router: Router = Router();
const ctrl = new PaymentController();

router.get("/", ctrl.getAll);
router.get("/pendientes", ctrl.getPendientes);
router.get("/ordenes-disponibles", ctrl.getOrdenesDisponibles);
router.get("/preview/orden/:ordenId", ctrl.previewByOrden);
router.get("/preview/:loteId", ctrl.preview);
router.get("/empleado/:planillaId/:empleadoId", ctrl.getPagoEmpleado);
router.get("/:id/detalle", ctrl.getDetalle);
router.get("/:id", ctrl.getById);
router.post("/generar/orden/:ordenId", ctrl.generarByOrden);
router.post("/generar/:loteId", ctrl.generar);
router.post("/:id/ejecutar", ctrl.ejecutarPago);
router.post("/:id/rechazar", ctrl.rechazar);

export default router;
