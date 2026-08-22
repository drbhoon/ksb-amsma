#!/bin/sh
# Railway start sequence.
#
# Written as a script rather than a one-line startCommand so that each phase
# announces itself: a failed boot shows which step died instead of just a
# healthcheck timeout with no explanation.
#
# prisma and tsx are runtime dependencies, not devDependencies, because this
# script needs them AFTER the build - a builder that prunes devDependencies from
# the runtime image would otherwise leave the container unable to start.
# resolve() still falls back to npx so a pruned image degrades to slow rather
# than broken.

set -e

PORT="${PORT:-3000}"

# Prefer the installed binary; fall back to npx without a network install prompt.
resolve() {
  if [ -x "./node_modules/.bin/$1" ]; then
    echo "./node_modules/.bin/$1"
  else
    echo "[start] WARNING: $1 not found in node_modules, falling back to npx" >&2
    echo "npx --yes $1"
  fi
}

PRISMA="$(resolve prisma)"
TSX="$(resolve tsx)"
NEXT="$(resolve next)"

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
$PRISMA migrate deploy

echo "[start] seeding committee members..."
if $TSX prisma/seed.ts; then
  echo "[start] seed complete"
else
  echo "[start] WARNING: seed failed - applications cannot be submitted until it"
  echo "[start] succeeds, because proposer and seconder must match committee rows."
fi

echo "[start] starting Next.js..."
exec $NEXT start -p "$PORT"
