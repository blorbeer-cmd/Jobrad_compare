# Memory / Fehlerlog

Diese Datei dient als Gedaechtnis fuer das Projekt. Fehler, die gemacht und behoben wurden, werden hier dokumentiert, damit sie nicht wiederholt werden.

## Projektuebersicht

- **Repo:** blorbeer-cmd/jobrad_compare
- **Branch:** claude/add-bike-filtering-DzZKh
- **Stack:** Next.js 14, TypeScript, Prisma (PostgreSQL), Tailwind CSS, shadcn/ui, Zod, Cheerio, Vitest
- **Zweck:** JobRad Fahrrad-Vergleichstool - Angebote verschiedener Haendler aggregieren und vergleichen

## Phasen-Status

- [x] Phase 1: Projekt-Setup (Next.js, Prisma, Tailwind, shadcn/ui, Zod, Vitest)
- [x] Phase 2: Authentifizierung (Magic Link + Invite-System)
- [x] Phase 3: UI-Komponenten (Filter, Vergleichstabelle, Admin-Dashboard)
- [x] Phase 4: Haendler-Adapter (Scraping/API)
- [ ] Phase 5: Deployment

## Entscheidungen

- Auth: Magic Link (via NextAuth.js Email Provider + nodemailer)
- Zugangsbeschraenkung: Invite-System (Admin laedt per E-Mail ein, 7 Tage gueltig)
- Erste Admin-E-Mail wird ueber ADMIN_EMAIL Env-Variable konfiguriert
- UI: shadcn/ui Komponenten (manuell erstellt, nicht via CLI)
- Selbst-Degradierungs-Schutz: Admins koennen ihre eigene Rolle nicht aendern
- Vergleich: Max. 4 Fahrraeder gleichzeitig, guenstigster Preis gruen hervorgehoben
- Adapter: Cheerio HTML-Scraping mit BaseAdapter-Klasse
- Cache: In-Memory mit 15 Min TTL, Admin kann Cache leeren
- Demo-Modus: USE_DEMO_ADAPTERS=true fuer Entwicklung ohne echtes Scraping

## Architektur-Hinweise

- `BikeExplorer` ist die Hauptkomponente fuer den User-Bereich (Client Component)
- BikeExplorer fetcht von /api/bikes (serverseitiger Adapter-Aufruf)
- Adapter-Registry aggregiert alle Adapter mit Promise.allSettled (graceful degradation)
- Cache wird nur gespeichert wenn mindestens ein Adapter erfolgreich war
- Admin-Bereich nutzt eigenes Layout mit Sidebar (/admin/layout.tsx)
- Admin-Seiten sind Server Components, Formulare/Tabellen sind Client Components
- requireAuth() und requireAdmin() fuer serverseitige Auth-Guards

## Fehler & Lessons Learned

### [2026-03-25] GitHub Code Scanning blockiert Push
- **Fehler:** push_files und create_or_update_file schlagen fehl mit "Waiting for Code Scanning results"
- **Ursache:** Branch Protection Rule erfordert Code Scanning, das fuer neue Commits noch laeuft
- **Fix:** Kurz warten und erneut versuchen, oder mehrere Dateien zusammen pushen
- **Regel:** Bei Repo mit Code Scanning: Pushes buendeln und bei 422-Fehler kurz warten

### [2026-03-25] push_files mit Sonderzeichen
- **Fehler:** push_files schlug mit "files parameter must be an array" fehl
- **Ursache:** Vermutlich Encoding-Problem mit Unicode-Zeichen in Content
- **Fix:** Umlaute als ae/oe/ue schreiben oder Unicode-Escapes vermeiden
- **Regel:** In push_files Content keine Umlaute/Sonderzeichen verwenden, ASCII bevorzugen
