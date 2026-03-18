import app from "./app";
import { AppDataSource } from "./src/config/data-source";
import { env } from "./src/config/env";

AppDataSource.initialize()
  .then(() => {
    console.log("Conectado a Oracle 21c");

    app.listen(env.PORT, () => {
      console.log(`   Modo: ${env.NODE_ENV}`);
      console.log(
        `   DB:   ${env.DB.HOST}:${env.DB.PORT}/${env.DB.SERVICE_NAME}`,
      );
    });
  })
  .catch((error) => {
    console.error("Error al conectar con Oracle:");
    if (error.errorNum) {
      console.error(`   ORA-${error.errorNum}: ${error.message}`);
    } else {
      console.error("  ", error.message);
    }
    process.exit(1);
  });
