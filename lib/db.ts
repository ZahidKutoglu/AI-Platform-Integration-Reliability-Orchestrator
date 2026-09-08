import { chmodSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const RUNTIME_DB = "/tmp/ai-ops.db";

function candidatePaths() {
  const paths = [
    join(process.cwd(), "lib", "demo.db"),
    join(process.cwd(), "prisma", "dev.db"),
    join(process.cwd(), ".next", "server", "prisma", "dev.db"),
    join(process.cwd(), ".next", "server", "lib", "demo.db"),
  ];
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    paths.unshift(join(dir, "demo.db"));
    paths.push(join(dir, "..", "prisma", "dev.db"));
    paths.push(join(dir, "../../../prisma/dev.db"));
    paths.push(join(dir, "../../../../lib/demo.db"));
  } catch {
    // import.meta.url is unavailable in some bundles
  }
  return paths;
}

function ensureRuntimeDatabase() {
  if (!existsSync(RUNTIME_DB)) {
    const bundled = candidatePaths().find((path) => existsSync(path));
    if (!bundled) {
      throw new Error(`Demo database was not bundled. Looked in: ${candidatePaths().join(", ")}`);
    }
    copyFileSync(bundled, RUNTIME_DB);
  }
  chmodSync(RUNTIME_DB, 0o644);
  return RUNTIME_DB;
}

function databaseUrl() {
  if (process.env.VERCEL) {
    return `file:${ensureRuntimeDatabase()}`;
  }
  return process.env.DATABASE_URL ?? "file:./dev.db";
}

function createClient() {
  return new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;
