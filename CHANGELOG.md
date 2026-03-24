# Changelog

Alle Änderungen am Projekt werden hier dokumentiert.

## [0.2.0] - 2026-03-24

### Phase 2: Authentifizierung (Magic Link + Invite-System)

#### Hinzugefügt
- NextAuth.js mit Email-Provider (Magic Link)
- `@auth/prisma-adapter` für Prisma-Integration
- `nodemailer` für E-Mail-Versand
- `Invite` Model im Prisma-Schema (email, invitedBy, usedAt, expiresAt)
- `Role` Enum (USER, ADMIN) im User-Model
- Login-Seite (`/login`) mit Magic-Link-Formular und Fehlermeldungen (deutsch)
- Admin-Bereich für Einladungen (`/admin/invites`) mit Formular und Tabelle
- API-Routen: `POST/GET /api/invites`, `DELETE /api/invites/:id`
- Zod-Validierung für Invite-Erstellung
- `signIn` Callback: Prüft ob Invite existiert, gültig und nicht abgelaufen ist
- Auto-Admin: Erste E-Mail aus `ADMIN_EMAIL` Env-Variable wird automatisch Admin
- Auth-Guards: `requireAuth()` und `requireAdmin()` Server-Helpers
- `SessionProvider` Client-Wrapper für NextAuth
- `UserNav` Komponente (Anmelden/Abmelden, Admin-Link, E-Mail-Anzeige)
- TypeScript-Typerweiterung für NextAuth Session (id, role)
- Layout aktualisiert mit SessionProvider und UserNav
- Startseite erfordert jetzt Authentifizierung

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
