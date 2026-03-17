import "reflect-metadata";
import express, { Application } from "express";
import { errorMiddleware } from "./src/middlewares/error.middleware";
import areaRoutes from "./src/modules/area/area.routes";
import positionWorkerRoutes from "./src/modules/positionWorker/positionWorker.routes";
import paymentRoutes from "./src/modules/payment/payment.routes";
import empleadoRoutes from "./src/modules/Empleado/empleado.routes";
import cuadrillaRoutes from "./src/modules/cuadrilla/cuadrilla.routes";
import miembroCuadrillaRoutes from "./src/modules/miembro-cuadrilla/miembro-cuadrilla.routes";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/areas`, areaRoutes);
app.use(`${API_PREFIX}/position-workers`, positionWorkerRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/empleados`, empleadoRoutes);
app.use(`${API_PREFIX}/cuadrillas`, cuadrillaRoutes);
app.use(`${API_PREFIX}/miembros-cuadrilla`, miembroCuadrillaRoutes);

app.use(errorMiddleware);

export default app;