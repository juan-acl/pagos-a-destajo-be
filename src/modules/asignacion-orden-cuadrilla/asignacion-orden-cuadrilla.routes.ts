import { Router } from "express";
import { AsignacionOrdenCuadrillaController } from "./asignacion-orden-cuadrilla.controller";

const router: Router = Router();
const ctrl = new AsignacionOrdenCuadrillaController();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
