import "reflect-metadata";
import express, { Application } from "express";
import cors from "cors";
import userRoutes from "./src/modules/user/user.routes";
import medidaRoutes from "./src/modules/medidas/medidas.routes";
import ordenTrabajoRoutes from "./src/modules/orden-trabajo/orden-trabajo.routes";
import asignacionOrdenCuadrillaRoutes from "./src/modules/asignacion-orden-cuadrilla/asignacion-orden-cuadrilla.routes";
import { errorMiddleware } from "./src/middlewares/error.middleware";
import positionWorkerRoutes from "./src/modules/positionWorker/positionWorker.routes";
import areaRoutes from "./src/modules/area/area.routes";
import paymentRoutes from "./src/modules/pagoPlanilla/pagoPlanilla.routes";
import employeeAssignmentRoutes from "./src/modules/employeeAssignment/employeeAssignment.routes";
import productionLotRoutes from "./src/modules/productionLot/productionLot.routes";
import productionReviewRoutes from "./src/modules/productionReview/productionReview.routes";
import empleadoRoutes from "./src/modules/Empleado/empleado.routes";
import cuadrillaRoutes from "./src/modules/cuadrilla/cuadrilla.routes";
import miembroCuadrillaRoutes from "./src/modules/miembro-cuadrilla/miembro-cuadrilla.routes";

const app: Application = express();
const API_PREFIX = "/api";

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/medidas`, medidaRoutes);
app.use(`${API_PREFIX}/ordenes-trabajo`, ordenTrabajoRoutes);
app.use(`${API_PREFIX}/asignaciones-orden-cuadrilla`, asignacionOrdenCuadrillaRoutes);
app.use(`${API_PREFIX}/empleados`, empleadoRoutes);
app.use(`${API_PREFIX}/cuadrillas`, cuadrillaRoutes);
app.use(`${API_PREFIX}/miembros-cuadrilla`, miembroCuadrillaRoutes);
app.use(`${API_PREFIX}/employee-assignment`, employeeAssignmentRoutes);
app.use(`${API_PREFIX}/production-lot`, productionLotRoutes);
app.use(`${API_PREFIX}/production-review`, productionReviewRoutes);
app.use(`${API_PREFIX}/position-workers`, positionWorkerRoutes);
app.use(`${API_PREFIX}/area`, areaRoutes);
app.use(`${API_PREFIX}/planilla`, paymentRoutes);

app.use(errorMiddleware);

export default app;