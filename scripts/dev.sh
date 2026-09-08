#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "Generating Prisma client and applying SQLite schema…"
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

echo "Starting Lumen on http://localhost:3000"
npm run dev
