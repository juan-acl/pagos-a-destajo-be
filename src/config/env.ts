import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(1521),
  DB_SERVICE_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SYNCHRONIZE: z.coerce.boolean().default(false),
  DB_LOGGING: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno inválidas:");
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path[0]}: ${issue.message}`);
  });
  process.exit(1);
}

const _env = parsed.data;

export const env = {
  PORT: _env.PORT,
  NODE_ENV: _env.NODE_ENV,
  DB: {
    HOST: _env.DB_HOST,
    PORT: _env.DB_PORT,
    SERVICE_NAME: _env.DB_SERVICE_NAME,
    USER: _env.DB_USER,
    PASSWORD: _env.DB_PASSWORD,
    SYNCHRONIZE: _env.DB_SYNCHRONIZE,
    LOGGING: _env.DB_LOGGING,
  },
};
