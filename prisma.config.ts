import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI uses this for migrations and introspection.
    // Use the direct, non-pooled connection string.
    url: env("DIRECT_URL"),
  },
});
