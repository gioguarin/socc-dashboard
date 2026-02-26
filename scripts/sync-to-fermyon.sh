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

CONTAINER="socc-dashboard"

# Build JSON payload using node inside the Docker container
payload=$(docker exec "$CONTAINER" node -e "
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = '/app/server/data';
const dbPath = path.join(dataDir, 'socc.db');

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
")

# POST to Fermyon sync endpoint
HTTP_CODE=$(curl -s -o /tmp/fermyon-sync-response.json -w "%{http_code}" \
  -X POST "${FERMYON_URL}/api/sync" \
  -H "Authorization: Bearer ${SYNC_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$payload")

if [ "$HTTP_CODE" -eq 200 ]; then
  # Parse response counts with grep/sed (no node needed)
  RESPONSE=$(cat /tmp/fermyon-sync-response.json)
  echo "$(date -Iseconds) Synced to Fermyon (HTTP 200): $RESPONSE"
else
  echo "$(date -Iseconds) Sync failed (HTTP $HTTP_CODE):" >&2
  cat /tmp/fermyon-sync-response.json >&2
  exit 1
fi
