import { Router } from "express";
import { EmpleadoController } from "./empleado.controller";

const router: Router = Router();
const ctrl = new EmpleadoController();

router.get("/", ctrl.getAll);
router.post("/login", ctrl.login);
router.get("/panel/:id", ctrl.getPanelEmpleado);
router.post("/:id/reporte", ctrl.createReporteOperario);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;