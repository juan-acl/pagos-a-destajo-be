import "reflect-metadata";
import express, { Application } from "express";
import { errorMiddleware } from "./src/middlewares/error.middleware";
import positionWorkerRoutes from "./src/modules/positionWorker/positionWorker.routes";
import areaRoutes from "./src/modules/area/area.routes";
import paymentRoutes from "./src/modules/pagoPlanilla/pagoPlanilla.routes";
import employeeAssignmentRoutes from "./src/modules/employeeAssignment/employeeAssignment.routes";
import productionLotRoutes from "./src/modules/productionLot/productionLot.routes";
import productionReviewRoutes from "./src/modules/productionReview/productionReview.routes";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/position-workers`, positionWorkerRoutes);
app.use(`${API_PREFIX}/area`, areaRoutes);
app.use(`${API_PREFIX}/planilla`, paymentRoutes);
app.use(`${API_PREFIX}/employee-assignment`, employeeAssignmentRoutes);
app.use(`${API_PREFIX}/production-lot`, productionLotRoutes);
app.use(`${API_PREFIX}/production-review`, productionReviewRoutes);

app.use(errorMiddleware);


export default app;
