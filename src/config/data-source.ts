import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { Puesto } from "../entity/positionWorker.entity";
import { PrefixNamingStrategy } from "./nomenclature";

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

  entities: [Puesto],

  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",

  logging: env.DB.LOGGING,
});
