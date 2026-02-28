#!/usr/bin/env python3
"""
Write TL;DR summaries back to news.json.
Called with: python3 pipeline-write-tldr.py <json-string>
Where json-string is: [{"id": "abc123", "tldr": "Summary text", "sentiment": "positive"}, ...]
"""
import json, sys, os

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
data_dir = os.path.join(project_dir, "server", "data")
news_path = os.path.join(data_dir, "news.json")

if len(sys.argv) < 2:
    print("Usage: pipeline-write-tldr.py '<json-array>'")
    sys.exit(1)

try:
    updates = json.loads(sys.argv[1])
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}")
    sys.exit(1)

try:
    with open(news_path) as f:
        news = json.load(f)
except Exception:
    print("Cannot read news.json")
    sys.exit(1)

# Build lookup
update_map = {u["id"]: u for u in updates}
count = 0

for item in news:
    if item["id"] in update_map:
        u = update_map[item["id"]]
        if u.get("tldr"):
            item["tldr"] = u["tldr"]
            count += 1
        if u.get("sentiment"):
            item["sentiment"] = u["sentiment"]

with open(news_path, "w") as f:
    json.dump(news, f, indent=2)

print(f"Updated {count} articles with TL;DR summaries")
