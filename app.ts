import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import { errorMiddleware } from "./src/middlewares/error.middleware";
import empleadoRoutes from "./src/modules/Empleado/empleado.routes";
import cuadrillaRoutes from "./src/modules/cuadrilla/cuadrilla.routes";
import miembroCuadrillaRoutes from "./src/modules/miembro-cuadrilla/miembro-cuadrilla.routes";

const app: Application = express();
const API_PREFIX = "/api";

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/empleados`, empleadoRoutes);
app.use(`${API_PREFIX}/cuadrillas`, cuadrillaRoutes);
app.use(`${API_PREFIX}/miembros-cuadrilla`, miembroCuadrillaRoutes);

app.use(errorMiddleware);

export default app;