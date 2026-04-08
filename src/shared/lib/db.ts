import { PrismaClient } from "@prisma/client";

declare global {
  // Reuse the Prisma client across hot reloads in development.
  // This prevents exhausting the PostgreSQL connection pool locally.
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
