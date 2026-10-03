import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (unpooled) connection on hosted providers such as Neon.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
