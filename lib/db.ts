import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function bundledDatabasePath() {
  return [
    join(process.cwd(), "prisma", "dev.db"),
    join(process.cwd(), ".next", "server", "prisma", "dev.db"),
  ].find((path) => existsSync(path));
}

function databaseUrl() {
  if (!process.env.VERCEL) {
    return process.env.DATABASE_URL ?? "file:./dev.db";
  }

  const runtimePath = "/tmp/ai-ops.db";
  if (!existsSync(runtimePath)) {
    const bundled = bundledDatabasePath();
    if (!bundled) {
      throw new Error("Demo database was not bundled with the deployment.");
    }
    copyFileSync(bundled, runtimePath);
  }

  return `file:${runtimePath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
