import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { Puesto } from "../entity/puesto.entity";
import { PrefixNamingStrategy } from "./nomenclature";
import { Area } from "../entity/area.entity";
import { Planilla } from "../entity/pagoPlanilla.entity";
import { AsignacionEmpleado } from "../entity/employeeAssignment.entity";
import { LoteProduccion } from "../entity/productionLot.entity";
import { RevisionProduccion } from "../entity/productionReview.entity";

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

  entities: [Puesto, Area, Planilla, AsignacionEmpleado, LoteProduccion, RevisionProduccion],

  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",

  logging: env.DB.LOGGING,
});
