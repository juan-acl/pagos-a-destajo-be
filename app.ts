import "reflect-metadata";
import express, { Application } from "express";
import userRoutes from "./src/modules/user/user.routes";
import { errorMiddleware } from "./src/middlewares/error.middleware";

const app: Application = express();
const API_PREFIX = "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${API_PREFIX}/users`, userRoutes);

app.use(errorMiddleware);

export default app;
