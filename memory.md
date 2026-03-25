# Memory / Fehlerlog

Diese Datei dient als Gedaechtnis fuer das Projekt.

## Projektuebersicht

- **Repo:** blorbeer-cmd/jobrad_compare
- **Branch:** claude/add-bike-filtering-DzZKh
- **Stack:** Next.js 14, TypeScript, Prisma (PostgreSQL), Tailwind CSS, shadcn/ui, Zod, Cheerio, Vitest
- **Zweck:** JobRad Fahrrad-Vergleichstool

## Phasen-Status

- [x] Phase 1: Projekt-Setup
- [x] Phase 2: Authentifizierung (Magic Link + Invite-System)
- [x] Phase 3: UI-Komponenten (Filter, Vergleichstabelle, Admin-Dashboard)
- [x] Phase 4: Haendler-Adapter (Scraping/API)
- [x] Phase 5: Deployment (Docker, CI/CD, Vercel)

## Deployment

### Docker (empfohlen)
```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Vercel
- Repo verbinden, Env-Vars setzen, fertig
- Prisma Generate laeuft automatisch via vercel.json buildCommand

### Env-Variablen (Production)
- DATABASE_URL - PostgreSQL Connection String
- NEXTAUTH_URL - Public URL der App
- NEXTAUTH_SECRET - Zufaelliger Secret (openssl rand -base64 32)
- EMAIL_SERVER_HOST/PORT/USER/PASSWORD - SMTP
- EMAIL_FROM - Absender-Adresse
- ADMIN_EMAIL - Erste Admin-E-Mail
- USE_DEMO_ADAPTERS - "false" fuer echte Scraper

## Entscheidungen

- Auth: Magic Link via NextAuth.js
- Invite-System fuer Zugangsbeschraenkung
- shadcn/ui Komponenten (manuell, nicht CLI)
- Cheerio HTML-Scraping fuer Haendler
- In-Memory Cache mit 15 Min TTL
- Docker Multi-Stage Build mit standalone Output
- GitHub Actions fuer CI/CD
- GHCR als Container Registry

## Fehler & Lessons Learned

### [2026-03-25] GitHub Code Scanning blockiert Push
- **Fehler:** push_files schlaegt fehl mit "Waiting for Code Scanning results"
- **Fix:** Kurz warten und erneut versuchen
- **Regel:** Pushes buendeln, bei 422-Fehler kurz warten

### [2026-03-25] push_files mit Sonderzeichen
- **Fehler:** push_files schlug mit "files parameter must be an array" fehl
- **Fix:** Umlaute als ae/oe/ue schreiben
- **Regel:** In push_files Content ASCII bevorzugen
