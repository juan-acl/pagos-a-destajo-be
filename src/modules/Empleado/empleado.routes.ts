import { Router } from "express";
import { EmpleadoController } from "./empleado.controller";

const router: Router = Router();
const ctrl = new EmpleadoController();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.post("/login", ctrl.login);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.get("/panel/:id", ctrl.getPanelEmpleado);


export default router;