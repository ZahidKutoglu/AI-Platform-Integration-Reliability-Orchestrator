import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (process.env.VERCEL) {
  process.env.DATABASE_URL = "file:./dev.db";
} else {
  process.env.DATABASE_URL ||= "file:./dev.db";
}

const prisma = join(root, "node_modules", ".bin", "prisma");
const result = spawnSync(prisma, ["generate"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
