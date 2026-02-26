#!/bin/bash
# sync-to-fermyon.sh — Push current data to Fermyon Cloud SQLite
# Run on Linode via crontab: */5 * * * * /path/to/sync-to-fermyon.sh
#
# Required environment variables (set in .env or export before running):
#   FERMYON_URL  — e.g. https://dashboard-test-xxxxx.fermyon.app
#   SYNC_TOKEN   — must match the sync_token variable on Fermyon Cloud

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Validate required vars
if [ -z "${FERMYON_URL:-}" ] || [ -z "${SYNC_TOKEN:-}" ]; then
  echo "Error: FERMYON_URL and SYNC_TOKEN must be set" >&2
  exit 1
fi

DATA_DIR="$PROJECT_DIR/server/data"
DB_PATH="$DATA_DIR/socc.db"

# Build JSON payload from data files + SQLite briefings
payload=$(node -e "
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = process.argv[1];
const dbPath = process.argv[2];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  } catch { return []; }
}

const news = readJson('news.json');
const threats = readJson('threats.json');
const stocks = readJson('stocks.json');

// Read briefings from SQLite
let briefings = [];
try {
  const db = new Database(dbPath, { readonly: true });
  const rows = db.prepare('SELECT id, date, content, highlights, created_at FROM briefings ORDER BY created_at DESC LIMIT 50').all();
  briefings = rows.map(r => ({
    id: r.id,
    date: r.date,
    content: r.content,
    highlights: JSON.parse(r.highlights),
    createdAt: r.created_at,
  }));
  db.close();
} catch (e) {
  console.error('Warning: could not read briefings from SQLite:', e.message);
}

console.log(JSON.stringify({ news, threats, stocks, briefings }));
" "$DATA_DIR" "$DB_PATH")

# POST to Fermyon sync endpoint
HTTP_CODE=$(curl -s -o /tmp/fermyon-sync-response.json -w "%{http_code}" \
  -X POST "${FERMYON_URL}/api/sync" \
  -H "Authorization: Bearer ${SYNC_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$payload")

if [ "$HTTP_CODE" -eq 200 ]; then
  COUNTS=$(cat /tmp/fermyon-sync-response.json | node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const c = d.data?.counts || {};
    console.log('news=' + (c.news||0) + ' threats=' + (c.threats||0) + ' stocks=' + (c.stocks||0) + ' briefings=' + (c.briefings||0));
  ")
  echo "$(date -Iseconds) Synced to Fermyon: $COUNTS"
else
  echo "$(date -Iseconds) Sync failed (HTTP $HTTP_CODE):" >&2
  cat /tmp/fermyon-sync-response.json >&2
  exit 1
fi
