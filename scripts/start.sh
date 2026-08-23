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

# Railway substitutes ${{Service.VAR}} references at deploy time. If the stored
# value has whitespace wrapped around the reference, the substitution silently
# fails and injects the whitespace alone - which is NOT caught by -z, and which
# Prisma then reports as "resolved to an empty string". Trim first, then judge.
DATABASE_URL=$(printf '%s' "$DATABASE_URL" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
export DATABASE_URL

case "$DATABASE_URL" in
  *'${{'*)
    echo "[start] FATAL: DATABASE_URL still contains an unresolved Railway"
    echo "[start] reference: $DATABASE_URL"
    echo "[start] The referenced service or variable name does not exist."
    echo "[start] Check the Postgres service is named exactly 'Postgres'."
    exit 1
    ;;
esac

if [ -z "$DATABASE_URL" ]; then
  echo "[start] FATAL: DATABASE_URL is empty or whitespace only."
  echo "[start] If it is set to \${{Postgres.DATABASE_URL}} in the dashboard,"
  echo "[start] the reference failed to resolve - almost always stray spaces or"
  echo "[start] a tab around the value. Re-enter it with no surrounding"
  echo "[start] whitespace, or from a terminal:"
  echo "[start]   railway variables --set 'DATABASE_URL=\${{Postgres.DATABASE_URL}}' --service ksb-amsma"
  exit 1
fi

case "$DATABASE_URL" in
  postgres://*|postgresql://*) ;;
  *)
    echo "[start] FATAL: DATABASE_URL does not look like a Postgres URL."
    echo "[start] It should begin with postgresql:// - got: $(printf '%s' "$DATABASE_URL" | cut -c1-24)..."
    exit 1
    ;;
esac

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

if [ -n "$TEST_PROPOSER_EMAILS" ]; then
  echo "[start] ***********************************************************"
  echo "[start] RULE 4 OVERRIDE ACTIVE - proposer/seconder allowlist in use:"
  echo "[start]   $TEST_PROPOSER_EMAILS"
  echo "[start] These addresses cannot vote; the approval quorum is unchanged."
  echo "[start] Unset TEST_PROPOSER_EMAILS before the site goes public."
  echo "[start] ***********************************************************"
fi

echo "[start] starting Next.js..."
exec $NEXT start -p "$PORT"
