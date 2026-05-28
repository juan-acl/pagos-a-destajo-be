import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { Puesto } from "../entity/puesto.entity";
import { PrefixNamingStrategy } from "./nomenclature";
import { Area } from "../entity/area.entity";
import { Planilla } from "../entity/pagoPlanilla.entity";
import { CuadrillaEntity } from "../entity/cuadrilla.entity";
import { Empleado } from "../entity/empleado.entity";
import { MiembroCuadrilla } from "../entity/miembro.entity";
import { MedidaEntity } from "../entity/medidas.entity";
import { AsignacionOrdenCuadrilla } from "../entity/asignacionCuadrilla.entity";
import { AsignacionEmpleado } from "../entity/asignacionEmpleado.entity";
import { LoteProduccion } from "../entity/productionLot.entity";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";
import { RevisionProduccion } from "../entity/revisionProduccion.entity";
import { RegistroDiario } from "../entity/registroDiario.entity";

export const AppDataSource = new DataSource({
  type: "oracle",
  host: env.DB.HOST,
  port: env.DB.PORT,
  serviceName: env.DB.SERVICE_NAME,
  username: env.DB.USER,
  password: env.DB.PASSWORD,
  extra: { thin: true },
  namingStrategy: new PrefixNamingStrategy(),
  entities: [
    Area,
    AsignacionOrdenCuadrilla,
    AsignacionEmpleado,
    CuadrillaEntity,
    Empleado,
    LoteProduccion,
    MedidaEntity,
    MiembroCuadrilla,
    OrdenTrabajoEntity,
    Planilla,
    Puesto,
    RegistroDiario,
    RevisionProduccion,
  ],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",
  logging: env.DB.LOGGING,
});