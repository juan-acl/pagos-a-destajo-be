import { Router } from "express";
import { MiembroCuadrillaController } from "./miembro-cuadrilla.controller";

const router: Router = Router();
const ctrl = new MiembroCuadrillaController();

router.get("/", ctrl.getAll);
router.get("/cuadrilla/:cuadrillaId", ctrl.getByCuadrilla);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;