import { Router } from "express";
import { OrdenTrabajoController } from "./orden-trabajo.controller";

const router: Router = Router();
const ctrl = new OrdenTrabajoController();

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
