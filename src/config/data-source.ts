import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { UserEntity } from "../entity/user.entity";
import { MedidaEntity } from "../entity/medidas.entity";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";
import { AsignacionOrdenCuadrillaEntity } from "../entity/asignacion-orden-cuadrilla.entity";

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

  entities: [UserEntity, MedidaEntity, OrdenTrabajoEntity, AsignacionOrdenCuadrillaEntity],

  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",

  logging: env.DB.LOGGING,
});
