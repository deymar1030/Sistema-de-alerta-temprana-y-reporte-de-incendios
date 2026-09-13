// Prisma 7 movio la URL de conexion (para `prisma migrate`/`prisma db push`)
// fuera de schema.prisma. El PrismaClient en tiempo de ejecucion usa su
// propio adapter (ver src/infrastructure/prismaConfig/prismaClient.js).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
