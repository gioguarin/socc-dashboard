# SOCC Dashboard

A personal security operations dashboard built for incident responders. Aggregates threat intelligence, industry news, stock data, and operational tools into a single interface designed for shift prep and ongoing awareness.

## Features

### Intelligence Feeds
- **Threat Intel** — CISA Known Exploited Vulnerabilities (KEV), The Hacker News, NVD enrichment (CVSS scores, patch links, affected products)
- **News Aggregation** — Google News RSS monitoring for Akamai, Cloudflare, Fastly, Zscaler, CrowdStrike, Palo Alto Networks, and F5
- **Stock Tracker** — Real-time quotes and 30-day sparklines from Yahoo Finance for tracked cybersecurity companies
- **CVE-to-Vendor Mapping** — Automatically flags CVEs that affect tracked companies

### Operational Tools
- **Shift Notes** — Markdown-supported notes with localStorage persistence
- **Project Tracker** — Kanban and list views for personal projects with deadlines
- **Calendar Widget** — Upcoming deadlines and manual events
- **Quick Links** — Configurable panel of frequently-used security tools (CISA, NVD, VirusTotal, Shodan, etc.)
- **Morning Briefings** — Archived daily briefings with Markdown rendering

### Analysis
- **Severity Trends** — 7-day and 30-day threat volume charts by severity level
- **News Sentiment** — Keyword-based positive/negative/neutral classification
- **Anomaly Detection** — Alerts when threat or news volume exceeds 2x the 7-day rolling average
- **Global Search** — Cross-panel search with highlighted results
- **Historical Data** — SQLite storage for long-term trend analysis

### Infrastructure
- **Authentication** — Optional JWT-based auth with httpOnly cookies (enable via environment variable)
- **Preferences** — Per-user settings for visible panels, refresh rate, sidebar state, default view
- **Themes** — Dark (default), Light, and CRT (retro terminal aesthetic)
- **Keyboard Shortcuts** — j/k navigation, / for search, ? for help, 1-7 for panel switching
- **Drag-and-Drop Layout** — Reorderable dashboard panels with persistent layout
- **Export** — Briefings (Markdown, PDF), Threat feed (CSV)
- **PWA** — Installable with offline caching via service worker
- **Docker** — Multi-stage build with Caddy reverse proxy configuration

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS 3
- **Backend:** Express.js, better-sqlite3
- **Visualization:** Recharts, Framer Motion
- **Layout:** react-grid-layout
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
git clone https://github.com/gioguarin/socc-dashboard.git
cd socc-dashboard
npm install
```

### Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3141` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `REFRESH_INTERVAL_MS` | `300000` | Data refresh interval (ms, minimum 300000) |
| `SOCC_AUTH_ENABLED` | `false` | Enable authentication |
| `SOCC_ADMIN_USER` | — | Admin username (required if auth enabled) |
| `SOCC_ADMIN_PASS` | — | Admin password (required if auth enabled) |
| `SOCC_JWT_SECRET` | — | JWT signing secret (required if auth enabled) |

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

The dashboard will be available at `http://localhost:3141`.

### Docker

```bash
docker compose up -d
```

This starts the dashboard behind a Caddy reverse proxy with security headers.

## Data Pipelines

The dashboard reads from JSON files in `server/data/`. External pipeline scripts populate these files with real data from public sources:

| Pipeline | Sources | Schedule |
|----------|---------|----------|
| `pipeline-news.sh` | Google News RSS, Akamai Blog | Every 4 hours |
| `pipeline-threats.sh` | CISA KEV, The Hacker News, NVD API | Every 4 hours |
| `pipeline-stocks.sh` | Yahoo Finance | Weekdays at market close |

All data is real, sourced, and deduplicated. No fabricated content.

### Running Pipelines Manually

```bash
# All pipelines
bash scripts/pipeline-all.sh

# Individual
bash scripts/pipeline-news.sh
bash scripts/pipeline-threats.sh
bash scripts/pipeline-stocks.sh
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Navigate between items |
| `/` | Focus search |
| `?` | Show shortcuts help |
| `Esc` | Close modals |
| `1`-`7` | Switch panels |

## Project Structure

```
socc-dashboard/
  server/           Express backend, API routes, SQLite, auth
    auth/           JWT token handling, middleware
    db/             SQLite connection, migrations, ingestion
    routes/         API endpoints (threats, news, stocks, briefings, sources, auth)
    data/           JSON data files and SQLite database
  src/              React frontend
    auth/           Auth context, adapters, protected routes
    components/     UI components by feature
    hooks/          Custom React hooks
    utils/          Formatters, constants, search, sentiment, vendor mapping
    contexts/       Theme context
  scripts/          Data pipeline shell scripts
  public/           PWA manifest, service worker, icons
```

## License

Private repository. Not licensed for redistribution.
