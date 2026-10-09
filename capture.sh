#!/usr/bin/env bash
# Cattura desktop + mobile dell'URL esatto in CAPTURE_URL.
# Output: final-desktop.png e final-mobile.png in CAPTURE_DIR.
# Exit 75: navigazione/browser/infrastruttura temporanea. Exit 1: difetti di script/rendering.
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd >/dev/null
/usr/bin/time -p test -n "${CAPTURE_URL:?Set CAPTURE_URL and CAPTURE_DIR.}"
/usr/bin/time -p test -n "${CAPTURE_DIR:?Set CAPTURE_URL and CAPTURE_DIR.}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"

# Display Xvfb persistente per Chromium headed (vedi Agents.md).
if [[ -z "${DISPLAY:-}" ]]; then
  DISPLAY_FILE="$HOME/.local/share/omgithub-playwright/display"
  if [[ -f "$DISPLAY_FILE" ]]; then
    DISPLAY=":$(/usr/bin/time -p cat "$DISPLAY_FILE")"
  else
    DISPLAY=":0"
  fi
  export DISPLAY
fi

# Chromium di sistema (canale chrome): il bundle ms-playwright non e' installato.
BROWSER_FLAG="--browser chrome"
SESSION="capture-$$"
CLI="playwright-cli -s=$SESSION"
DESKTOP="$CAPTURE_DIR/final-desktop.png"
MOBILE="$CAPTURE_DIR/final-mobile.png"

close_browser() {
  /usr/bin/time -p playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true
}
trap close_browser EXIT

echo "capturing $CAPTURE_URL -> $CAPTURE_DIR (display $DISPLAY)"

# Apertura browser + navigazione con retry (fallimenti qui = infrastruttura temporanea).
OPENED=0
for i in 1 2 3; do
  if /usr/bin/time -p $CLI open $BROWSER_FLAG "$CAPTURE_URL" >/dev/null 2>&1; then
    OPENED=1
    break
  fi
  echo "open attempt $i failed, retrying..."
  /usr/bin/time -p sleep 3
done
if [[ "$OPENED" != 1 ]]; then
  echo "browser open/navigation failed after retries" >&2
  exit 75
fi

# Attesa contenuto renderizzato (non uno scheletro vuoto).
READY=0
for i in $(/usr/bin/time -p seq 1 30); do
  TEXT="$(/usr/bin/time -p $CLI eval "() => document.body ? document.body.innerText.length : 0" 2>/dev/null | awk '/^### Result/{getline; print}' || echo 0)"
  NUM="$(echo "$TEXT" | tr -cd '0-9')"
  NUM="${NUM:-0}"
  if [[ "$NUM" -ge 100 ]]; then
    READY=1
    break
  fi
  /usr/bin/time -p sleep 2
done
if [[ "$READY" != 1 ]]; then
  CODE="$(/usr/bin/time -p curl --silent --max-time 10 -o /dev/null -w '%{http_code}' "$CAPTURE_URL" || echo 000)"
  echo "page never rendered (http $CODE)" >&2
  if [[ "$CODE" == 000 || "$CODE" == 408 || "$CODE" == 429 || "$CODE" == 5* ]]; then
    exit 75
  fi
  exit 1
fi
echo "rendered content detected"

# Vista desktop.
/usr/bin/time -p $CLI resize 1440 900
/usr/bin/time -p sleep 1
/usr/bin/time -p $CLI screenshot --filename "$DESKTOP"

# Vista mobile.
/usr/bin/time -p $CLI resize 390 844
/usr/bin/time -p sleep 1
/usr/bin/time -p $CLI screenshot --filename "$MOBILE"

trap - EXIT
close_browser

# Verifica PNG reali (magic + dimensione minima).
for f in "$DESKTOP" "$MOBILE"; do
  /usr/bin/time -p test -f "$f" || { echo "missing $f" >&2; exit 1; }
  MAGIC="$(/usr/bin/time -p head -c 8 "$f" | od -An -tx1 | tr -d ' \n')"
  [[ "$MAGIC" == "89504e470d0a1a0a" ]] || { echo "not a PNG: $f" >&2; exit 1; }
  SIZE="$(/usr/bin/time -p wc -c < "$f" | tr -d ' ')"
  [[ "$SIZE" -ge 10000 ]] || { echo "suspiciously small capture ($SIZE bytes): $f" >&2; exit 1; }
  echo "ok $f ($SIZE bytes)"
done

echo "capture complete, app left running"
