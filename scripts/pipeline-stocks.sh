#!/bin/bash
# SOCC Dashboard Pipeline — Stock Tracker
# Pulls REAL stock data from Yahoo Finance API
# All data is live market data. No fabricated content.

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
DATA_DIR="$HOME/.openclaw/workspace/socc-dashboard/server/data"
mkdir -p "$DATA_DIR"

TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

SYMBOLS="AKAM NET FSLY ZS CRWD PANW FFIV"

for SYM in $SYMBOLS; do
  DATA=$(curl -s -m 10 "https://query1.finance.yahoo.com/v8/finance/chart/${SYM}?interval=1d&range=1mo" -H "User-Agent: $UA" 2>/dev/null)
  echo "|||SYM:${SYM}|||"
  echo "$DATA"
done > "$TMPFILE"

python3 - "$TMPFILE" "$DATA_DIR" << 'PYEOF'
import json, sys, os, re
from datetime import datetime, timezone

tmpfile = sys.argv[1]
data_dir = sys.argv[2]

with open(tmpfile) as f:
    raw = f.read()

names = {
    'AKAM': 'Akamai Technologies',
    'NET': 'Cloudflare',
    'FSLY': 'Fastly',
    'ZS': 'Zscaler',
    'CRWD': 'CrowdStrike',
    'PANW': 'Palo Alto Networks',
    'FFIV': 'F5'
}

sections = re.split(r'\|\|\|SYM:(\w+)\|\|\|', raw)
stocks = []

i = 1
while i < len(sections):
    sym = sections[i].strip()
    json_str = sections[i+1].strip() if i+1 < len(sections) else ""
    i += 2

    if not json_str:
        continue

    try:
        parsed = json.loads(json_str)
        result = parsed['chart']['result'][0]
        meta = result['meta']
        
        price = meta.get('regularMarketPrice', 0)
        prev_close = meta.get('chartPreviousClose', price)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * 100, 2) if prev_close else 0

        # Build sparkline from closing prices (last 30 days)
        closes = result.get('indicators', {}).get('quote', [{}])[0].get('close', [])
        sparkline = [round(c, 2) for c in closes if c is not None]

        stocks.append({
            "symbol": sym,
            "name": names.get(sym, sym),
            "price": round(price, 2),
            "change": change,
            "changePercent": change_pct,
            "sparkline": sparkline[-30:],
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"Error parsing {sym}: {e}", file=sys.stderr)

# Write output
output_path = os.path.join(data_dir, "stocks.json")
with open(output_path, "w") as f:
    json.dump(stocks, f, indent=2)

print(f"Pipeline: {len(stocks)} stocks updated")
PYEOF
