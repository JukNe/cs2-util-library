import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Do not use env("...") here — it throws when the variable is missing, and
 * `prisma generate` (postinstall on Vercel) loads this file without needing a DB URL.
 * Prefer direct Postgres for Migrate/Studio; fall back to DATABASE_URL if needed.
 */
const datasourceUrl =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.PRISMA_DATABASE_URL ||
  "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
