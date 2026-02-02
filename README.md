# SOCC Dashboard

A self-hosted security operations dashboard for incident responders and security analysts. Aggregates threat intelligence, industry news, and market data into a single interface designed for shift prep and situational awareness.

Built for personal use. No telemetry, no analytics, no third-party tracking.

![Dark Theme](https://img.shields.io/badge/theme-dark-0a0e1a)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Intelligence Feeds
- **Threat Intel** -- CISA Known Exploited Vulnerabilities (KEV), The Hacker News, NVD enrichment with CVSS scores, patch links, and affected product data
- **CVE-to-Vendor Mapping** -- Automatically flags CVEs affecting tracked companies
- **News Aggregation** -- Configurable Google News RSS monitoring across multiple companies and sources
- **Stock Tracker** -- Market data with 30-day sparkline charts via Yahoo Finance

### Analysis
- **Severity Trends** -- 7-day and 30-day threat volume charts by severity level
- **News Sentiment** -- Keyword-based classification (positive/negative/neutral)
- **Anomaly Detection** -- Alerts when threat or news volume exceeds 2x the 7-day rolling average
- **Historical Data** -- SQLite storage for long-term trend queries
- **Global Search** -- Cross-panel search with highlighted results

### Operational Tools
- **Shift Notes** -- Markdown-supported notes with local persistence
- **Project Tracker** -- Kanban and list views with deadlines
- **Calendar Widget** -- Upcoming deadlines and manual events
- **Quick Links** -- Configurable panel of frequently-used tools
- **Briefing Archive** -- Daily briefings with export to Markdown, PDF, or CSV

### Infrastructure
- **Authentication** -- Optional JWT-based auth with httpOnly cookies
- **Preferences** -- Per-user settings for visible panels, refresh rate, sidebar state
- **Themes** -- Dark (default), Light, and CRT (retro terminal)
- **Keyboard Shortcuts** -- j/k navigation, / search, ? help, 1-7 panel switching
- **Drag-and-Drop Layout** -- Reorderable dashboard panels with persistent layout
- **PWA** -- Installable with offline caching via service worker
- **Docker** -- Multi-stage build with Caddy reverse proxy

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3 |
| Backend | Express.js, better-sqlite3 |
| Charts | Recharts |
| Animation | Framer Motion |
| Layout | react-grid-layout |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/socc-dashboard.git
cd socc-dashboard
npm install
```

### Configuration

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3141` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `REFRESH_INTERVAL_MS` | `300000` | Data refresh interval in ms (min 300000) |
| `SOCC_AUTH_ENABLED` | `false` | Enable JWT authentication |
| `SOCC_ADMIN_USER` | -- | Admin username (required if auth enabled) |
| `SOCC_ADMIN_PASS` | -- | Admin password (required if auth enabled) |
| `SOCC_JWT_SECRET` | -- | JWT signing secret (required if auth enabled) |

### Running

Development (frontend + backend concurrently):
```bash
npm run dev:full
```

Production:
```bash
npm run build
npm start
```

The dashboard runs at `http://localhost:3141`.

### Docker

```bash
docker compose up -d
```

Starts the dashboard behind a Caddy reverse proxy with security headers (X-Frame-Options, HSTS, Content-Type nosniff).

## Data Pipelines

The dashboard reads from JSON files in `server/data/`. Pipeline scripts in `scripts/` populate these files from public data sources. The server gracefully handles missing data files, so the dashboard works out of the box with empty panels until pipelines are configured.

| Script | Sources | Description |
|--------|---------|-------------|
| `pipeline-news.sh` | Google News RSS, Akamai Blog | Fetches news for configured companies |
| `pipeline-threats.sh` | CISA KEV, The Hacker News, NVD API | Fetches CVEs and threat articles with CVSS enrichment |
| `pipeline-stocks.sh` | Yahoo Finance | Fetches stock quotes and 30-day price history |
| `pipeline-all.sh` | All of the above | Runs all pipelines in sequence |

### Running Pipelines

```bash
# All pipelines
bash scripts/pipeline-all.sh

# Individual
bash scripts/pipeline-news.sh
bash scripts/pipeline-threats.sh
bash scripts/pipeline-stocks.sh
```

Pipelines are designed to be run via cron or any scheduler. Recommended intervals:
- News and threats: every 4 hours
- Stocks: once daily after market close

All data is sourced from public feeds, deduplicated, and linked back to original sources. No fabricated content.

### Customizing Sources

News sources are defined in `scripts/pipeline-news.sh`. To track different companies, edit the `fetch_source` calls with your own Google News search queries.

Threat sources (CISA KEV and The Hacker News) are defined in `scripts/pipeline-threats.sh`.

## Shift Configuration

The shift indicator defaults to Sun-Wed, 7:00 AM - 5:00 PM ET. Customize via the Preferences modal or by setting `socc-shift-config` in localStorage:

```json
{
  "days": [0, 1, 2, 3],
  "startHour": 7,
  "endHour": 17,
  "timezone": "America/New_York"
}
```

Days use JavaScript convention: 0 = Sunday, 6 = Saturday.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate between items |
| `/` | Focus search |
| `?` | Show shortcuts help |
| `Esc` | Close modals |
| `1` - `7` | Switch panels |

## Project Structure

```
socc-dashboard/
  server/             Express backend
    auth/             JWT token handling, middleware
    db/               SQLite connection, migrations, ingestion
    routes/           API endpoints
    data/             Runtime data (gitignored) + example files
  src/                React frontend
    auth/             Auth context, adapters, protected routes
    components/       UI components organized by feature
    hooks/            Custom React hooks
    utils/            Formatters, search, sentiment, vendor mapping
    contexts/         Theme context
  scripts/            Data pipeline scripts
  public/             PWA manifest, service worker, icons
```

## Contributing

This is a personal tool, but contributions are welcome. Please open an issue before submitting large changes.

## License

MIT
