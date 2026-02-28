#!/bin/bash
# SOCC Dashboard Pipeline — Threat Intel Feed
# Pulls REAL CVE/threat data from:
#   1. CISA Known Exploited Vulnerabilities (KEV) catalog
#   2. The Hacker News RSS (security-filtered)
# All data is real, sourced, and linked. No fabricated content.

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/server/data"
SEEN_FILE="$DATA_DIR/.memory/threat-seen.txt"
mkdir -p "$DATA_DIR/.memory"
touch "$SEEN_FILE"

EXISTING="$DATA_DIR/threats.json"
if [ ! -f "$EXISTING" ] || [ ! -s "$EXISTING" ]; then
  echo "[]" > "$EXISTING"
fi

# Fetch sources to temp files
CISA_TMP=$(mktemp)
THN_TMP=$(mktemp)
trap "rm -f $CISA_TMP $THN_TMP" EXIT

curl -s -m 20 "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json" -H "User-Agent: $UA" > "$CISA_TMP" 2>/dev/null
curl -s -m 15 "https://feeds.feedburner.com/TheHackersNews" -H "User-Agent: $UA" > "$THN_TMP" 2>/dev/null

# Parse and build threats.json
python3 - "$CISA_TMP" "$THN_TMP" "$DATA_DIR" "$SEEN_FILE" << 'PYEOF'
import json, sys, os, hashlib, re
from datetime import datetime, timedelta, timezone
import xml.etree.ElementTree as ET

cisa_path = sys.argv[1]
thn_path = sys.argv[2]
data_dir = sys.argv[3]
seen_file = sys.argv[4]

# Load existing
existing_path = os.path.join(data_dir, "threats.json")
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

# === CISA KEV (last 14 days) ===
try:
    with open(cisa_path) as f:
        cisa_data = json.load(f)
except:
    cisa_data = {"vulnerabilities": []}

cutoff = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")

for vuln in cisa_data.get("vulnerabilities", []):
    date_added = vuln.get("dateAdded", "")
    if date_added < cutoff:
        continue

    cve_id = vuln.get("cveID", "")
    item_id = hashlib.md5(cve_id.encode()).hexdigest()[:12]

    if item_id in existing_ids or item_id in seen_ids:
        continue

    vendor = vuln.get("vendorProject", "")
    product = vuln.get("product", "")
    desc = vuln.get("shortDescription", "")
    due_date = vuln.get("dueDate", "")

    new_items.append({
        "id": item_id,
        "cveId": cve_id,
        "title": f"{cve_id}: {vendor} {product}",
        "description": f"{desc} (Remediation due: {due_date})",
        "severity": "critical",
        "cvssScore": None,
        "source": "CISA KEV",
        "publishedAt": f"{date_added}T00:00:00Z",
        "affectedProducts": [f"{vendor} {product}"],
        "status": "new",
        "cisaKev": True,
        "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}"
    })
    seen_ids.add(item_id)

# === The Hacker News ===
try:
    with open(thn_path) as f:
        thn_data = f.read()
    root = ET.fromstring(thn_data)
except:
    root = None

security_kw = re.compile(
    r'CVE|vuln|zero.?day|exploit|breach|DDoS|ransomware|malware|attack|hack|'
    r'threat|botnet|APT|phishing|RCE|patch|critical|backdoor|trojan|spyware|'
    r'supply.?chain|privilege.?escalat|remote.?code|injection|overflow',
    re.I
)

critical_kw = re.compile(r'critical|RCE|remote code|zero.?day|actively exploit', re.I)
high_kw = re.compile(r'high|breach|ransomware|backdoor|supply.?chain|privilege', re.I)
medium_kw = re.compile(r'medium|phishing|trojan|spyware|injection', re.I)

def guess_severity(title, desc=""):
    combined = f"{title} {desc}"
    if critical_kw.search(combined): return "critical"
    if high_kw.search(combined): return "high"
    if medium_kw.search(combined): return "medium"
    return "low"

cve_pattern = re.compile(r'CVE-\d{4}-\d{4,}')

if root is not None:
    for item in root.findall('.//item')[:20]:
        title_el = item.find('title')
        link_el = item.find('link')
        pub_el = item.find('pubDate')
        desc_el = item.find('description')

        title = title_el.text.strip() if title_el is not None and title_el.text else ""
        link = link_el.text.strip() if link_el is not None and link_el.text else ""
        pub_date = pub_el.text.strip() if pub_el is not None and pub_el.text else ""
        desc = desc_el.text.strip() if desc_el is not None and desc_el.text else ""
        desc = re.sub(r'<[^>]+>', '', desc).strip()[:300]

        if not title or not security_kw.search(title):
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

        cve_match = cve_pattern.search(f"{title} {desc}")
        cve_id = cve_match.group(0) if cve_match else None

        new_items.append({
            "id": item_id,
            "cveId": cve_id,
            "title": title,
            "description": desc,
            "severity": guess_severity(title, desc),
            "cvssScore": None,
            "source": "The Hacker News",
            "publishedAt": iso_date,
            "affectedProducts": [],
            "status": "new",
            "cisaKev": False,
            "url": link
        })
        seen_ids.add(item_id)

# Merge and write
combined = new_items + existing
combined.sort(key=lambda x: x.get("publishedAt", ""), reverse=True)
combined = combined[:150]

with open(existing_path, "w") as f:
    json.dump(combined, f, indent=2)

with open(seen_file, "w") as f:
    f.write("\n".join(seen_ids))

print(f"Pipeline: {len(new_items)} new threat items, {len(combined)} total")
PYEOF

# === NVD Enrichment Pass ===
# Fetches CVSS scores, affected products, and patch URLs from NVD API v2.0
# Rate-limited: 5 requests per 30 seconds without API key
echo "--- NVD Enrichment ---"
python3 - "$DATA_DIR" << 'NVDEOF'
import json, sys, os, time, urllib.request, urllib.error

data_dir = sys.argv[1]
threats_path = os.path.join(data_dir, "threats.json")

# Tracked vendors for CVE-to-vendor mapping
TRACKED_VENDORS = {
    "akamai": ["akamai"],
    "cloudflare": ["cloudflare"],
    "fastly": ["fastly"],
    "zscaler": ["zscaler"],
    "crowdstrike": ["crowdstrike"],
    "paloalto": ["palo_alto", "paloalto", "palo alto", "pan-os", "globalprotect", "prisma", "cortex"],
    "f5": ["f5", "big-ip", "big_ip", "nginx"],
}

def fetch_nvd(cve_id):
    """Fetch CVE data from NVD API v2.0"""
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "SOCC-Dashboard/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
        print(f"  NVD fetch failed for {cve_id}: {e}")
        return None

def extract_cvss(nvd_data):
    """Extract best available CVSS score from NVD response"""
    vulns = nvd_data.get("vulnerabilities", [])
    if not vulns:
        return None
    metrics = vulns[0].get("cve", {}).get("metrics", {})
    # Prefer CVSS v3.1, then v3.0, then v2
    for key in ["cvssMetricV31", "cvssMetricV30"]:
        if key in metrics and metrics[key]:
            return metrics[key][0].get("cvssData", {}).get("baseScore")
    if "cvssMetricV2" in metrics and metrics["cvssMetricV2"]:
        return metrics["cvssMetricV2"][0].get("cvssData", {}).get("baseScore")
    return None

def extract_products(nvd_data):
    """Extract affected product names from CPE match data"""
    vulns = nvd_data.get("vulnerabilities", [])
    if not vulns:
        return []
    products = set()
    configs = vulns[0].get("cve", {}).get("configurations", [])
    for config in configs:
        for node in config.get("nodes", []):
            for match in node.get("cpeMatch", []):
                cpe = match.get("criteria", "")
                parts = cpe.split(":")
                if len(parts) >= 5:
                    vendor = parts[3].replace("_", " ").title()
                    product = parts[4].replace("_", " ").title()
                    if product != "*":
                        products.add(f"{vendor} {product}")
    return list(products)[:10]

def extract_patch_urls(nvd_data):
    """Extract patch/advisory URLs from CVE references"""
    vulns = nvd_data.get("vulnerabilities", [])
    if not vulns:
        return []
    refs = vulns[0].get("cve", {}).get("references", [])
    patches = []
    patch_tags = {"Patch", "Vendor Advisory", "Mitigation"}
    for ref in refs:
        tags = set(ref.get("tags", []))
        if tags & patch_tags:
            patches.append(ref.get("url", ""))
    return patches[:5]

def map_vendors(products, description=""):
    """Check if CVE affects any tracked vendor"""
    affected = []
    combined = (" ".join(products) + " " + description).lower()
    for vendor_key, keywords in TRACKED_VENDORS.items():
        if any(kw in combined for kw in keywords):
            affected.append(vendor_key)
    return affected

# Load threats
try:
    with open(threats_path) as f:
        threats = json.load(f)
except Exception:
    print("No threats.json found, skipping NVD enrichment")
    sys.exit(0)

# Find items with cveId but no cvssScore (need enrichment)
to_enrich = [t for t in threats if t.get("cveId") and t.get("cvssScore") is None]
MAX_PER_RUN = 5  # Keep batch small to avoid timeouts (5 * 7s = 35s max)
batch = to_enrich[:MAX_PER_RUN]
print(f"NVD: {len(to_enrich)} need enrichment, processing {len(batch)} this run")

enriched_count = 0
for item in batch:
    cve_id = item["cveId"]
    print(f"  Fetching {cve_id}...")

    nvd_data = fetch_nvd(cve_id)
    if nvd_data:
        score = extract_cvss(nvd_data)
        if score is not None:
            item["cvssScore"] = score
            enriched_count += 1

        products = extract_products(nvd_data)
        if products and not item.get("affectedProducts"):
            item["affectedProducts"] = products

        patches = extract_patch_urls(nvd_data)
        if patches:
            item["patchUrls"] = patches

        vendors = map_vendors(
            item.get("affectedProducts", []),
            item.get("description", "")
        )
        if vendors:
            item["affectedVendors"] = vendors

    # Rate limit: 7 seconds between requests (5 req/30s limit)
    if item != batch[-1]:  # Skip sleep after last item
        time.sleep(7)

# Also do vendor mapping for all items that have products but no affectedVendors yet
for item in threats:
    if not item.get("affectedVendors"):
        vendors = map_vendors(
            item.get("affectedProducts", []),
            item.get("description", "")
        )
        if vendors:
            item["affectedVendors"] = vendors

# Write back
with open(threats_path, "w") as f:
    json.dump(threats, f, indent=2)

print(f"NVD: {enriched_count} items enriched with CVSS scores")
NVDEOF
