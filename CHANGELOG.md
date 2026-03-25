# Changelog

Alle Aenderungen am Projekt werden hier dokumentiert.

## [0.4.0] - 2026-03-25

### Phase 4: Haendler-Adapter

#### Hinzugefuegt

**Adapter-Infrastruktur:**
- `BaseAdapter` abstrakte Klasse mit gemeinsamen Utilities (fetchPage, mapCategory, parsePrice, extractBrand)
- In-Memory Cache mit TTL (15 Min Standard), cacheGet/cacheSet/cacheClear/cacheStats
- Adapter-Registry mit `fetchAllBikes()` - aggregiert alle Adapter mit `Promise.allSettled`
- Automatischer Fallback: Cache wird nur gespeichert wenn mindestens ein Adapter erfolgreich
- Konfigurierbar via `USE_DEMO_ADAPTERS` Env-Variable

**3 Haendler-Adapter (HTML-Scraping mit Cheerio):**
- `FahrradXXLAdapter` - fahrrad-xxl.de (6 Kategorien, JobRad-Filter)
- `LuckyBikeAdapter` - lucky-bike.de (6 Kategorien)
- `BikeDiscountAdapter` - bike-discount.de (6 Kategorien)

**Demo-Adapter:**
- 16 realistische Demo-Fahrraeder aus 8 Kategorien und 7 Haendlern
- Placeholder-Bilder via placehold.co
- 200ms simulierte Latenz

**API-Routen:**
- `GET /api/bikes` - Alle Fahrraeder laden (auth required)
- `GET /api/bikes?refresh=true` - Cache umgehen
- `GET /api/bikes/cache` - Cache-Stats (Admin only)
- `DELETE /api/bikes/cache` - Cache leeren (Admin only)

**BikeExplorer Update:**
- Fetched jetzt von `/api/bikes` statt Demo-Daten
- Loading-State mit Skeleton-Anzeige
- Error-State mit Fehlermeldung
- Refresh-Button zum manuellen Aktualisieren
- Cache-Badge und Fehler-Badge in der Toolbar

**Dependencies:**
- `cheerio` ^1.0.0 fuer HTML-Parsing

## [0.3.0] - 2026-03-24

### Phase 3: Modernes UI (User + Admin)

#### Hinzugefuegt

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

**User-Bereich - Fahrrad-Explorer:**
- BikeCard - Karte mit Bild, Kategorie-Badge, Preis, Favorisieren-Button, Vergleich-Button
- BikeGrid - Responsive Grid (1-4 Spalten), Loading Skeletons, Empty State
- FilterSidebar - Suche, Kategorie-Chips, Preisspanne, Haendler-/Marken-Dropdown, Sortierung, Mobile-Toggle
- ComparisonView - Vergleichstabelle mit Bild, Preis, Kategorie, Verfuegbarkeit; guenstigster Preis gruen markiert
- ComparisonBar - Fixierte Bottom-Bar mit ausgewaehlten Raedern und Vergleich-Button
- StatsBar - Ergebnisse, Durchschnittspreis, Preisspanne, Anzahl Haendler
- BikeExplorer - Hauptkomponente mit Tabs (Durchsuchen/Vergleich), Filter-State

**Admin-Bereich:**
- Admin-Layout mit Sidebar-Navigation (Dashboard, Einladungen, Benutzer)
- Dashboard mit Statistik-Karten und Liste der letzten Registrierungen
- Benutzerverwaltung mit Tabelle, Suche, Rollenaenderung
- API-Route PATCH /api/admin/users/:id/role mit Selbst-Degradierungs-Schutz
- Einladungsseite verbessert mit Mini-Statistiken

**Login-Seite:**
- Redesign mit Card-Layout und Icons

**UserNav:**
- Redesign als Dropdown-Menue mit Avatar

## [0.2.0] - 2026-03-24

### Phase 2: Authentifizierung (Magic Link + Invite-System)

#### Hinzugefuegt
- NextAuth.js mit Email-Provider (Magic Link)
- @auth/prisma-adapter fuer Prisma-Integration
- nodemailer fuer E-Mail-Versand
- Invite Model im Prisma-Schema (email, invitedBy, usedAt, expiresAt)
- Role Enum (USER, ADMIN) im User-Model
- Login-Seite (/login) mit Magic-Link-Formular und Fehlermeldungen (deutsch)
- Admin-Bereich fuer Einladungen (/admin/invites) mit Formular und Tabelle
- API-Routen: POST/GET /api/invites, DELETE /api/invites/:id
- Zod-Validierung fuer Invite-Erstellung
- signIn Callback: Prueft ob Invite existiert, gueltig und nicht abgelaufen ist
- Auto-Admin: Erste E-Mail aus ADMIN_EMAIL Env-Variable wird automatisch Admin
- Auth-Guards: requireAuth() und requireAdmin() Server-Helpers
- SessionProvider Client-Wrapper fuer NextAuth
- UserNav Komponente (Anmelden/Abmelden, Admin-Link, E-Mail-Anzeige)
- TypeScript-Typerweiterung fuer NextAuth Session (id, role)
- Layout aktualisiert mit SessionProvider und UserNav
- Startseite erfordert jetzt Authentifizierung

## [0.1.0] - 2026-03-24

### Phase 1: Projekt-Setup

#### Hinzugefuegt
- Next.js 14 Projekt mit TypeScript (strict mode)
- Prisma ORM mit PostgreSQL-Schema
- GDPR-Felder im User-Model
- Tailwind CSS mit shadcn/ui Theme-Konfiguration
- Zod-basiertes Bike-Schema mit Kategorien
- DealerAdapter Interface als Vertrag fuer Shop-Anbindungen
- Prisma Client Singleton
- Zod-basierte Env-Validierung
- cn() Utility fuer Tailwind Class Merging
- Security Headers in next.config.js
- Vitest Test-Setup
- Root Layout mit Header/Footer
