# Changelog

Alle Änderungen am Projekt werden hier dokumentiert.

## [0.3.0] - 2026-03-24

### Phase 3: Modernes UI (User + Admin)

#### Hinzugefügt

**shadcn/ui Basiskomponenten:**
- Button (6 Varianten: default, destructive, outline, secondary, ghost, link)
- Input, Select (mit nativen HTML-Elementen)
- Card (Header, Title, Description, Content, Footer)
- Badge (default, secondary, destructive, outline, success, warning)
- Table (Header, Body, Row, Head, Cell)
- Dialog (mit Overlay, Close-Button, Header, Title, Description)
- Tabs (Context-basiert, mit TabsList, TabsTrigger, TabsContent)
- DropdownMenu (mit Click-Outside-Handling)
- Avatar + AvatarFallback
- Separator, Skeleton

**User-Bereich — Fahrrad-Explorer:**
- `BikeCard` — Karte mit Bild, Kategorie-Badge, Preis, Favorisieren-Button, Vergleich-Button
- `BikeGrid` — Responsive Grid (1-4 Spalten), Loading Skeletons, Empty State
- `FilterSidebar` — Suche, Kategorie-Chips, Preisspanne, Händler-/Marken-Dropdown, Sortierung, Mobile-Toggle
- `ComparisonView` — Vergleichstabelle mit Bild, Preis, Kategorie, Verfügbarkeit; günstigster Preis grün markiert
- `ComparisonBar` — Fixierte Bottom-Bar mit ausgewählten Rädern und Vergleich-Button
- `StatsBar` — Ergebnisse, Durchschnittspreis, Preisspanne, Anzahl Händler
- `BikeExplorer` — Hauptkomponente mit Tabs (Durchsuchen/Vergleich), Filter-State, Demo-Daten
- 8 Demo-Fahrräder aus verschiedenen Kategorien und Händlern

**Admin-Bereich:**
- Admin-Layout mit Sidebar-Navigation (Dashboard, Einladungen, Benutzer)
- Admin-Sidebar mit Avatar, Shield-Icon, aktiver Navigationszustand
- Dashboard (`/admin`) mit Statistik-Karten (Benutzer, Einladungen, Angenommen, Offen) und Liste der letzten Registrierungen
- Benutzerverwaltung (`/admin/users`) mit Tabelle, Suche, Rollenänderung (Admin/User Toggle)
- API-Route `PATCH /api/admin/users/:id/role` mit Selbst-Degradierungs-Schutz
- Einladungsseite (`/admin/invites`) verbessert mit Mini-Statistiken und neuen shadcn-Komponenten

**Login-Seite:**
- Redesign mit Card-Layout, Icons (Mail, CheckCircle), verbesserter UX

**UserNav:**
- Redesign als Dropdown-Menü mit Avatar, Admin-Link, Abmelden

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
