import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct Postgres URL for Migrate / Studio (not Accelerate)
    url: env("POSTGRES_URL"),
  },
});
