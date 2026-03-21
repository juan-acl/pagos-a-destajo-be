import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";
import { MedidaEntity } from "../entity/medidas.entity";
import { OrdenTrabajoEntity } from "../entity/orden-trabajo.entity";
import { AsignacionOrdenCuadrillaEntity } from "../entity/asignacion-orden-cuadrilla.entity";
import { Puesto } from "../entity/puesto.entity";
import { PrefixNamingStrategy } from "./nomenclature";
import { Area } from "../entity/area.entity";
import { Planilla } from "../entity/pagoPlanilla.entity";
import { AsignacionEmpleado } from "../entity/employeeAssignment.entity";
import { LoteProduccion } from "../entity/productionLot.entity";
import { RevisionProduccion } from "../entity/productionReview.entity";
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

  entities: [
    MedidaEntity,
    OrdenTrabajoEntity,
    AsignacionOrdenCuadrillaEntity,
    Area,
    Planilla,
    AsignacionEmpleado,
    LoteProduccion,
    RevisionProduccion,
    Puesto,
    EmpleadoEntity,
    CuadrillaEntity,
    MiembroCuadrillaEntity,
  ],

  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",

  logging: env.DB.LOGGING,
});
