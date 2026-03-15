import "reflect-metadata";
import express, { Application } from "express";
import positionWorkerRoutes from "./src/modules/positionWorker/positionWorker.routes";
import { errorMiddleware } from "./src/middlewares/error.middleware";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all(API_PREFIX, (req, res)=> res.json({hola: "hola"}))
app.use(`${API_PREFIX}/position-workers`, positionWorkerRoutes);
app.use(errorMiddleware);


export default app;
