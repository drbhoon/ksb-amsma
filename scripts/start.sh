#!/bin/sh
# Railway start sequence.
#
# Written as a script rather than a one-line startCommand so that each phase
# announces itself: a failed boot shows which step died instead of just a
# healthcheck timeout with no explanation.
#
# Uses ./node_modules/.bin directly rather than npx — the binaries are already
# installed (buildCommand passes --include=dev) and npx would otherwise try to
# reach the network on every boot, which is slow and can hang the healthcheck.

set -e

BIN=./node_modules/.bin
PORT="${PORT:-3000}"

echo "[start] node $(node -v), port ${PORT}"

if [ -z "$DATABASE_URL" ]; then
  echo "[start] FATAL: DATABASE_URL is not set."
  echo "[start] Add a Postgres service in Railway and set this service's"
  echo "[start] DATABASE_URL variable to \${{Postgres.DATABASE_URL}}."
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then
  echo "[start] WARNING: NEXT_PUBLIC_SITE_URL is not set. Committee review links"
  echo "[start] and payment links will be generated with a relative host and will"
  echo "[start] not work. Set it before creating any test application."
fi

echo "[start] applying database migrations..."
"$BIN/prisma" migrate deploy

echo "[start] seeding committee members..."
if "$BIN/tsx" prisma/seed.ts; then
  echo "[start] seed complete"
else
  echo "[start] WARNING: seed failed — applications cannot be submitted until it"
  echo "[start] succeeds, because proposer and seconder must match committee rows."
fi

echo "[start] starting Next.js..."
exec "$BIN/next" start -p "$PORT"
