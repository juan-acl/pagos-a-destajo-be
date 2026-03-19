import "reflect-metadata";
import express, { Application } from "express";
import userRoutes from "./src/modules/user/user.routes";
import medidaRoutes from "./src/modules/medidas/medidas.routes";
import ordenTrabajoRoutes from "./src/modules/orden-trabajo/orden-trabajo.routes";
import asignacionOrdenCuadrillaRoutes from "./src/modules/asignacion-orden-cuadrilla/asignacion-orden-cuadrilla.routes";
import { errorMiddleware } from "./src/middlewares/error.middleware";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/medidas`, medidaRoutes);
app.use(`${API_PREFIX}/ordenes-trabajo`, ordenTrabajoRoutes);
app.use(`${API_PREFIX}/asignaciones-orden-cuadrilla`, asignacionOrdenCuadrillaRoutes);

app.use(errorMiddleware);

export default app;
