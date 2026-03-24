# Changelog

Alle Änderungen am Projekt werden hier dokumentiert.

## [0.1.0] - 2026-03-24

### Phase 1: Projekt-Setup

#### Hinzugefügt
- Next.js 14 Projekt mit TypeScript (strict mode)
- Prisma ORM mit PostgreSQL-Schema (User, Account, Session, VerificationToken, SavedBike)
- GDPR-Felder im User-Model (`consentGiven`, `consentAt`)
- Tailwind CSS mit shadcn/ui Theme-Konfiguration
- shadcn/ui CLI-Konfiguration (`components.json`)
- Zod-basiertes Bike-Schema mit Kategorien (E-Bike, City, Trekking, MTB, Rennrad, Cargo, Gravel, Kinder)
- `DealerAdapter` Interface als Vertrag für Shop-Anbindungen
- Prisma Client Singleton (`src/lib/db.ts`)
- Zod-basierte Env-Validierung (`src/lib/env.ts`)
- `cn()` Utility für Tailwind Class Merging (`src/lib/utils.ts`)
- Security Headers in `next.config.js` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Vitest Test-Setup mit `@/` Alias
- Root Layout mit Header/Footer (deutsche Sprache)
- Startseite mit Platzhalter
- `.env.example` mit Template für DB, NextAuth, Email
- `.gitignore` für Node.js/Next.js
- `memory.md` für Fehler-Tracking und Lessons Learned
- `CHANGELOG.md` für Änderungsprotokoll
