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

## Entscheidungen

- Auth: Magic Link via NextAuth.js
- Invite-System fuer Zugangsbeschraenkung
- shadcn/ui Komponenten (manuell, nicht CLI)
- Cheerio HTML-Scraping fuer Haendler
- In-Memory Cache mit 15 Min TTL
- Docker Multi-Stage Build mit standalone Output
- GitHub Actions fuer CI/CD, GHCR als Container Registry

## Fehler & Lessons Learned

### [2026-03-25] GitHub Code Scanning blockiert Push
- **Fix:** Pushes buendeln, bei 422-Fehler kurz warten

### [2026-03-25] frontend/ verursacht Build-Fehler
- **Fehler:** Next.js findet frontend/src/App.tsx und importiert react-router-dom
- **Fix:** frontend in tsconfig.json exclude aufgenommen
