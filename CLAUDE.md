# SOCC Dashboard

## Project Context
Personal security operations dashboard for a Security Incident Responder. Used for shift prep, threat awareness, and industry monitoring. Built for eventual public deployment with authenticated access.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Express.js
- Styling: Dark cybersecurity command center aesthetic
- Target Infra: Linode (Docker), platform-agnostic auth, Caddy reverse proxy
- Version Control: GitHub

## Current Features
- Threat intel feed (CISA KEV, Hacker News)
- News aggregation (Akamai, Cloudflare, Fastly, Zscaler, CrowdStrike, Palo Alto, F5)
- Stock tracker with 30-day sparklines
- Morning briefing system (Telegram, 6:30 AM ET)
- Live clock, shift status indicator, severity badges

## Design Principles
- Zero fake data — real sources, linked and deduplicated
- Minimal, scannable UI — glanceable during shift prep
- Mobile-friendly
- Accessible color contrast despite dark theme

---

## AUTONOMY LEVEL: HIGH
You are authorized to implement any feature from the roadmap without asking permission. Work through phases in order. Make decisions confidently.

### You Have Full Authority To:
- Implement any roadmap feature
- Refactor code for maintainability
- Add dependencies if justified (note in commit message)
- Create new components, hooks, utilities
- Restructure file organization
- Fix bugs immediately when found
- Improve UI/UX based on best practices
- Add error handling, loading states, accessibility
- Write and run tests
- Update documentation and this file

### Stop and Ask Only When:
- A feature requires paid API access or new credentials
- You're considering removing a feature entirely
- You encounter a security vulnerability in a dependency
- You need clarification on business logic or personal preference
- Something in the roadmap contradicts another requirement
- You'd need to exceed 500 lines in a single file

### Hard Rules (Never Break):
- No secrets, API keys, or credentials in code — use .env (gitignored)
- No mock/fake data in production pipelines
- No auto-refresh faster than 5 minutes
- No deprecated or vulnerable dependencies
- No breaking existing functionality without replacement
- No analytics/telemetry
- Maintain mobile responsiveness
- All TypeScript strict (no `any`)
- Environment variables for all config

### Code Standards
- Functional React, hooks only
- Named exports
- Components under 200 lines
- Co-located styles (CSS modules)
- Naming: `ComponentName.tsx`, `useSomeHook.ts`
- Error boundaries on all async panels
- Graceful error handling on all network calls
- Comment non-obvious logic

### Git Behavior
- Atomic commits, clear messages
- Format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- Commit after each completed feature or logical unit
- Push to GitHub after each phase or significant milestone
- Never commit broken code
- Never commit .env or secrets

---

## FEATURE ROADMAP
Work through these in order. Update checkboxes as you complete. If blocked, skip and note why in this file.

### Phase 1: Foundation & Polish
- [x] Dockerize (Dockerfile + docker-compose.yml + Caddyfile)
- [x] Environment config (.env.example with validation on startup)
- [x] Loading skeletons for all async panels
- [x] Error boundaries with fallback UI
- [x] PWA manifest + service worker
- [x] Favicon, meta tags, Open Graph

### Phase 2: Operational Depth
- [x] CVE enrichment — NVD API (CVSS, products, patches)
- [x] CVE-to-vendor mapping — flag CVEs for tracked companies
- [x] Threat severity trends — 7/30-day sparkline charts
- [x] News sentiment indicator
- [x] RSS source manager UI (add/remove/reorder feeds)
- [x] Global search across all panels
- [x] Keyboard shortcuts (j/k nav, / search, ? help modal)

### Phase 3: Personal Ops
- [x] Shift notes — localStorage persistence, Markdown support
- [x] Project tracker panel (Laser Rat Labs, DEF CON 561, science fair)
- [x] Calendar/deadlines widget
- [x] Quick links panel (configurable)

### Phase 4: Auth & Multi-User
- [x] Protected route architecture
- [x] User context provider
- [x] Preferences system (theme, panels, refresh rate)
- [x] Auth integration points (leave implementation for later)

### Phase 5: Advanced
- [x] SQLite for historical data
- [x] Anomaly alerting (volume spikes)
- [x] Digest customization UI
- [x] Drag-and-drop widget layout
- [x] Export briefings (PDF/Markdown)
- [x] Theme toggle (dark/light/CRT)

---

## Progress Log
Update this section after completing work:

| Date | Phase | Completed | Notes |
|------|-------|-----------|-------|
| 2026-02-02 | Pre-Phase | Initial build, data pipelines, cvssScore null fix | React + Express scaffold, 3 pipeline scripts, cron automation |
| 2026-02-02 | Phase 1 | Foundation & Polish — all 6 items complete | Dockerize, env config, loading skeletons, error boundaries, PWA, favicon/meta |
| 2026-02-02 | Phase 2 | Operational Depth — all 7 items complete | NVD enrichment pipeline, vendor mapping, severity trends, sentiment analysis, RSS manager, global search, keyboard shortcuts |
| 2026-02-02 | Phase 3 | Personal Ops — all 4 items complete | Shift notes w/ Markdown, project tracker w/ kanban+list, calendar/deadlines widget, quick links panel |
| 2026-02-02 | Phase 4 | Auth & Multi-User — all 4 items complete | Protected routes, auth context/provider, preferences system, adapter pattern for future OAuth/SSO |
| 2026-02-02 | Phase 5 | Advanced — all 6 items complete | SQLite historical data (better-sqlite3), anomaly detection (volume spikes), digest customization UI, drag-and-drop layout (react-grid-layout v2), export briefings (MD/PDF) + threats (CSV), theme toggle (dark/light/CRT) |

---

## Blockers
Note anything blocking progress:

- (none yet)
