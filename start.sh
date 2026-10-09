#!/usr/bin/env bash
# Avvio progetto: installa dipendenze, compila quando serve, pubblica
# l'output statico e serve l'app in foreground su PORT (default 3000).
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_ROOT="$(/usr/bin/time -p pwd)"
PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
STATIC_DIR="$PROJECT_ROOT/dist"

/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p test -f package.json

# Dipendenze: installa solo quando mancano o il lockfile e' cambiato.
if [[ ! -d node_modules ]] || [[ ! -f node_modules/.package-lock.json ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
else
  echo "dependencies up to date, skipping install"
fi

# Build Next.js solo quando le sorgenti sono piu' nuove dell'ultimo build.
NEEDS_BUILD=0
if [[ ! -f .next/BUILD_ID ]]; then
  NEEDS_BUILD=1
else
  if [[ -n "$(/usr/bin/time -p find app lib scripts package.json next.config.js tsconfig.js tailwind.config.js postcss.config.js -newer .next/BUILD_ID 2>/dev/null | head -1)" ]]; then
    NEEDS_BUILD=1
  fi
fi
if [[ "$NEEDS_BUILD" == 1 ]]; then
  /usr/bin/time -p npm run build
else
  echo "build up to date, skipping next build"
fi

# Output statico per deployment/hosting statico (sempre rigenerato: veloce).
/usr/bin/time -p node scripts/build-static.mjs
/usr/bin/time -p test -f "$STATIC_DIR/index.html"

/usr/bin/time -p bash -c "printf '%s' '{\"project\":\"$PROJECT_ROOT\",\"directory\":\"$STATIC_DIR\"}' > \"$WEB_DIR/deployment-output.json\""
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
echo ""

# Server in foreground: la sessione tmux resta viva finche' il processo vive.
exec /usr/bin/time -p npx next start -H 0.0.0.0 -p "$PORT"
