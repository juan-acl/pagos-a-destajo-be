import "reflect-metadata";
import express, { Application } from "express";
import { errorMiddleware } from "./src/middlewares/error.middleware";
import positionWorkerRoutes from "./src/modules/positionWorker/positionWorker.routes";
import areaRoutes from "./src/modules/area/area.routes";
import paymentRoutes from "./src/modules/payment/payment.routes";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/position-workers`, positionWorkerRoutes);
app.use(`${API_PREFIX}/area`, areaRoutes);
app.use(`${API_PREFIX}/planilla`, paymentRoutes);

app.use(errorMiddleware);


export default app;
