import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { PrefixNamingStrategy } from "./nomenclature";
import { Area } from "../entity/area.entity";
import { Planilla } from "../entity/payment.entity";
import { Puesto } from "../entity/positionWorker.entity";
import { EmpleadoEntity } from "../entity/empleado.entity";
import { CuadrillaEntity } from "../entity/cuadrilla.entity";
import { MiembroCuadrillaEntity } from "../entity/miembro-cuadrilla.entity";

export const AppDataSource = new DataSource({
  type: "oracle",
  host: env.DB.HOST,
  port: env.DB.PORT,
  serviceName: env.DB.SERVICE_NAME,
  username: env.DB.USER,
  password: env.DB.PASSWORD,
  extra: {
    thin: true,
  },
  namingStrategy: new PrefixNamingStrategy(),
  entities: [Area, Planilla, Puesto, EmpleadoEntity, CuadrillaEntity, MiembroCuadrillaEntity],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",
  logging: env.DB.LOGGING,
});