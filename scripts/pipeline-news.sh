#!/bin/bash
# SOCC Dashboard Pipeline — News Feed
# Pulls REAL news from Google News RSS + Akamai Blog
# All items are real, sourced, and linked. No fabricated content.
# Compatible with macOS bash 3.2 (no associative arrays).

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
DATA_DIR="$HOME/.openclaw/workspace/socc-dashboard/server/data"
SEEN_FILE="$HOME/.openclaw/workspace/memory/news-seen.txt"
touch "$SEEN_FILE"
mkdir -p "$DATA_DIR"

EXISTING="$DATA_DIR/news.json"
if [ ! -f "$EXISTING" ] || [ ! -s "$EXISTING" ]; then
  echo "[]" > "$EXISTING"
fi

TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

# Fetch each source individually — no associative arrays needed
fetch_source() {
  local key="$1"
  local query="$2"
  echo "|||SOURCE:${key}|||"
  curl -s -m 15 -H "User-Agent: $UA" "https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en" 2>/dev/null
}

fetch_source "akamai"      '%22Akamai%22+when:7d'       >> "$TMPFILE"
fetch_source "cloudflare"  '%22Cloudflare%22+when:7d'   >> "$TMPFILE"
fetch_source "fastly"      '%22Fastly%22+when:7d'       >> "$TMPFILE"
fetch_source "zscaler"     '%22Zscaler%22+when:7d'      >> "$TMPFILE"
fetch_source "crowdstrike" '%22CrowdStrike%22+when:7d'  >> "$TMPFILE"
fetch_source "paloalto"    '%22Palo+Alto+Networks%22+when:7d' >> "$TMPFILE"
fetch_source "f5"          '%22F5+Networks%22+OR+%22F5+Inc%22+when:7d' >> "$TMPFILE"

# Akamai Blog RSS
echo "|||SOURCE:akamai_blog|||" >> "$TMPFILE"
curl -s -m 15 -H "User-Agent: $UA" 'https://feeds.feedburner.com/akamai/blog' >> "$TMPFILE" 2>/dev/null

python3 - "$TMPFILE" "$DATA_DIR" "$SEEN_FILE" << 'PYEOF'
import json, sys, os, hashlib, re
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

tmpfile = sys.argv[1]
data_dir = sys.argv[2]
seen_file = sys.argv[3]

existing_path = os.path.join(data_dir, "news.json")
try:
    with open(existing_path) as f:
        existing = json.load(f)
except:
    existing = []

try:
    with open(seen_file) as f:
        seen_ids = set(line.strip() for line in f if line.strip())
except:
    seen_ids = set()

existing_ids = {item["id"] for item in existing}
new_items = []

with open(tmpfile) as f:
    raw = f.read()

sections = re.split(r'\|\|\|SOURCE:(\w+)\|\|\|', raw)

source_map = {
    "akamai": "akamai", "cloudflare": "cloudflare", "fastly": "fastly",
    "zscaler": "zscaler", "crowdstrike": "crowdstrike",
    "paloalto": "paloalto", "f5": "f5", "akamai_blog": "akamai"
}

security_kw = re.compile(r'CVE|vuln|zero.?day|exploit|breach|DDoS|ransomware|malware|attack|hack|threat|botnet|APT|phishing', re.I)
product_kw = re.compile(r'launch|release|announc|update|new feature|beta|GA|platform|product|service', re.I)
business_kw = re.compile(r'earning|revenue|acqui|merger|partner|invest|IPO|stock|quarter|fiscal|CEO|hire', re.I)
research_kw = re.compile(r'research|report|study|survey|analysis|whitepaper|finding|trend|insight|state of', re.I)
incident_kw = re.compile(r'outage|incident|down|disrupt|issue|failure|impacted|degraded', re.I)

def categorize(title):
    if incident_kw.search(title): return "incident"
    if security_kw.search(title): return "security"
    if research_kw.search(title): return "research"
    if business_kw.search(title): return "business"
    if product_kw.search(title): return "product"
    return "product"

source_patterns = {
    "akamai": re.compile(r'akamai|akam', re.I),
    "cloudflare": re.compile(r'cloudflare', re.I),
    "fastly": re.compile(r'fastly', re.I),
    "zscaler": re.compile(r'zscaler', re.I),
    "crowdstrike": re.compile(r'crowdstrike', re.I),
    "paloalto": re.compile(r'palo\s*alto', re.I),
    "f5": re.compile(r'f5\b|f5\s', re.I),
    "akamai_blog": None
}

i = 1
while i < len(sections):
    source_key = sections[i].strip()
    xml_data = sections[i+1] if i+1 < len(sections) else ""
    i += 2

    dashboard_source = source_map.get(source_key, "general")
    pattern = source_patterns.get(source_key)

    try:
        root = ET.fromstring(xml_data.strip())
    except:
        continue

    for item in root.findall('.//item')[:10]:
        title_el = item.find('title')
        link_el = item.find('link')
        pub_el = item.find('pubDate')
        source_el = item.find('source')

        title = title_el.text.strip() if title_el is not None and title_el.text else ""
        link = link_el.text.strip() if link_el is not None and link_el.text else ""
        pub_date = pub_el.text.strip() if pub_el is not None and pub_el.text else ""
        news_source = source_el.text.strip() if source_el is not None and source_el.text else ""

        if not title or not link:
            continue
        if pattern and not pattern.search(title):
            continue

        item_id = hashlib.md5(link.encode()).hexdigest()[:12]
        if item_id in existing_ids or item_id in seen_ids:
            continue

        try:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(pub_date)
            iso_date = dt.isoformat()
        except:
            iso_date = datetime.now(timezone.utc).isoformat()

        summary = f"Via {news_source}" if news_source else f"Source: {source_key}"

        new_items.append({
            "id": item_id,
            "title": title,
            "summary": summary,
            "source": dashboard_source,
            "url": link,
            "publishedAt": iso_date,
            "category": categorize(title),
            "status": "new"
        })
        seen_ids.add(item_id)

combined = new_items + existing
combined.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
combined = combined[:200]

with open(existing_path, "w") as f:
    json.dump(combined, f, indent=2)

with open(seen_file, "w") as f:
    f.write("\n".join(seen_ids))

print(f"Pipeline: {len(new_items)} new news items, {len(combined)} total")
PYEOF
