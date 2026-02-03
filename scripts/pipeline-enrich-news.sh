#!/bin/bash
# SOCC Dashboard Pipeline — News AI Enrichment
# Fetches full article text for new items and generates TL;DR summaries.
# Designed to be called by an OpenClaw cron job (isolated session with LLM access).
# Outputs a list of article IDs and their content for the cron agent to summarize.

DATA_DIR="$HOME/.openclaw/workspace/socc-dashboard/server/data"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

python3 - "$DATA_DIR" << 'PYEOF'
import json, sys, os, subprocess, re

data_dir = sys.argv[1]
news_path = os.path.join(data_dir, "news.json")

try:
    with open(news_path) as f:
        news = json.load(f)
except Exception:
    print("No news.json found")
    sys.exit(0)

# Find items without TL;DR (limit to 10 per run to control costs)
needs_tldr = [item for item in news if not item.get("tldr")][:10]

if not needs_tldr:
    print("ENRICH_NONE")
    sys.exit(0)

# Output items that need enrichment as JSON for the cron agent to process
print("ENRICH_START")
for item in needs_tldr:
    print(json.dumps({
        "id": item["id"],
        "title": item["title"],
        "url": item["url"],
        "source": item["source"],
        "summary": item.get("summary", "")
    }))
print("ENRICH_END")
PYEOF
