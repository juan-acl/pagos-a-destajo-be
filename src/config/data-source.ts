import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { UserEntity } from "../entity/user.entity";
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
  entities: [UserEntity, EmpleadoEntity, CuadrillaEntity, MiembroCuadrillaEntity],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",
  logging: env.DB.LOGGING,
});