import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (process.env.VERCEL) {
  process.env.DATABASE_URL = "file:./dev.db";
} else {
  process.env.DATABASE_URL ||= "file:./dev.db";
}

function run(bin, args) {
  const result = spawnSync(join(root, "node_modules", ".bin", bin), args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("prisma", ["generate"]);
run("prisma", ["db", "push", "--skip-generate"]);
run("tsx", ["prisma/seed.ts"]);
