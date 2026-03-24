# Memory / Fehlerlog

Diese Datei dient als Gedächtnis für das Projekt. Fehler, die gemacht und behoben wurden, werden hier dokumentiert, damit sie nicht wiederholt werden.

## Projektübersicht

- **Repo:** blorbeer-cmd/jobrad_compare
- **Branch:** claude/add-bike-filtering-DzZKh
- **Stack:** Next.js 14, TypeScript, Prisma (PostgreSQL), Tailwind CSS, shadcn/ui, Zod, Vitest
- **Zweck:** JobRad Fahrrad-Vergleichstool — Angebote verschiedener Händler aggregieren und vergleichen

## Phasen-Status

- [x] Phase 1: Projekt-Setup (Next.js, Prisma, Tailwind, shadcn/ui, Zod, Vitest)
- [x] Phase 2: Authentifizierung (Magic Link + Invite-System)
- [ ] Phase 3: UI-Komponenten (Filter, Vergleichstabelle)
- [ ] Phase 4: Händler-Adapter (Scraping/API)
- [ ] Phase 5: Deployment

## Entscheidungen

- Auth: Magic Link (via NextAuth.js Email Provider + nodemailer)
- Zugangsbeschränkung: Invite-System (Admin lädt per E-Mail ein, 7 Tage gültig)
- Später ggf. Switch auf Domain-Filter möglich
- Erste Admin-E-Mail wird über `ADMIN_EMAIL` Env-Variable konfiguriert

## Fehler & Lessons Learned

_Bisher keine Fehler dokumentiert._

<!-- Format für neue Einträge:
### [Datum] Kurzbeschreibung
- **Fehler:** Was ist passiert?
- **Ursache:** Warum ist es passiert?
- **Fix:** Was wurde geändert?
- **Regel:** Was muss in Zukunft beachtet werden?
-->
