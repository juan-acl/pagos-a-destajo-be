import "reflect-metadata";
import express, { Application } from "express";
import userRoutes from "./src/modules/user/user.routes";
import empleadoRoutes from "./src/modules/Empleado/empleado.routes";
import cuadrillaRoutes from "./src/modules/cuadrilla/cuadrilla.routes";
import miembroCuadrillaRoutes from "./src/modules/miembro-cuadrilla/miembro-cuadrilla.routes";
import { errorMiddleware } from "./src/middlewares/error.middleware";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/empleados`, empleadoRoutes);
app.use(`${API_PREFIX}/cuadrillas`, cuadrillaRoutes);
app.use(`${API_PREFIX}/miembros-cuadrilla`, miembroCuadrillaRoutes);

app.use(errorMiddleware);

export default app;