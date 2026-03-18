import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { Puesto } from "../entity/puesto.entity";
import { PrefixNamingStrategy } from "./nomenclature";
import { Area } from "../entity/area.entity";
import { Planilla } from "../entity/pagoPlanilla.entity";
import { Cuadrilla } from "../entity/cuadrilla.entity";
import { Empleado } from "../entity/empleado.entity";
import { MiembroCuadrilla } from "../entity/miembro.entity";
import { Medidas } from "../entity/medidas.entity";
import { AsignacionOrdenCuadrilla } from "../entity/asignacionCuadrilla.entity";
import { AsignacionEmpleado } from "../entity/asignacionEmpleado.entity";
import { LoteProduccion } from "../entity/loteProduccion.entity";
import { OrdenTrabajo } from "../entity/ordenTrabajo.entity";
import { RevisionProduccion } from "../entity/revisionProduccion.entity";

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

  entities: [
    Area,
    AsignacionOrdenCuadrilla,
    AsignacionEmpleado, 
    Cuadrilla, 
    Empleado, 
    LoteProduccion, 
    Medidas, 
    MiembroCuadrilla, 
    OrdenTrabajo, 
    Planilla, 
    Puesto, 
    RevisionProduccion 
  ],

  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",

  logging: env.DB.LOGGING,
});
