import { Router } from "express";
import { RegistroDiarioController } from "./registroDiario.controller";

const router: Router = Router();
const ctrl = new RegistroDiarioController();

router.post("/registrar", ctrl.registrarDias);
router.post("/activar-vigencia", ctrl.activarVigencia);
router.get("/habilitados/:ordenId", ctrl.getHabilitados);
router.get("/orden/:ordenId", ctrl.getByOrden);

export default router;
