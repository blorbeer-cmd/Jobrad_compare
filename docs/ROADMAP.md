# JobRad Compare – Roadmap

> Stand: April 2026. Dieses Dokument spiegelt den tatsächlichen Projektstatus wider.

---

## Übersicht

| Phase | Fokus | Status |
|-------|-------|--------|
| **Phase 0** | Projekt-Setup, Auth, CI/CD | ✅ Abgeschlossen |
| **Phase 1** | UI-Modernisierung, Dark Mode, Mobile | ✅ Abgeschlossen |
| **Phase 2** | Adapter-Infrastruktur, Schema, Security | ✅ Abgeschlossen |
| **Phase 3** | Vergleichsmotor, DB-Normalisierung, Tests | ✅ Abgeschlossen |
| **Phase 4** | Entity Resolution, erweiterte Filter | ✅ Abgeschlossen |
| **Phase 5** | Calculator, Rose Bikes & Bike24 Adapter | ✅ Abgeschlossen |
| **Phase 6** | Weitere Händler-Adapter | 🔄 Laufend |
| **Phase 7** | Admin-Review, Monitoring, Skalierung | ⏳ Ausstehend |

---

## Phase 0 – Projekt-Setup ✅

- Next.js 16 + TypeScript strict, App Router
- Prisma 7 + PostgreSQL (Neon), `@prisma/adapter-pg`
- Tailwind CSS + shadcn/ui (13 Base-Komponenten)
- Zod-Validierung, Vitest, GitHub Actions CI/CD
- Vercel Deployment, Dockerfile, docker-compose
- NextAuth.js v4: Magic Link (EmailProvider) + Dev-Login (CredentialsProvider)
- Invite-System (7-Tage-Ablauf), Admin-Rolle (ADMIN_EMAIL), GDPR-Felder
- Content-Security-Policy, Rate Limiting (Middleware), alle Security Header
- GDPR: Account-Löschung (Art. 17), Daten-Export (Art. 20), Datenschutzseite
- `/api/health` Endpoint

---

## Phase 1 – UI-Modernisierung ✅

- Dark Mode via `next-themes`, systemabhängig, CSS-Variable-basiert
- Modernes Layout: sticky Header, Bike-Logo, ThemeToggle, UserNav
- BikeCard: Hover-Lift, dark-safe Save-Button, UVP durchgestrichen
- FilterSidebar: Sheet-basierter Mobile-Drawer statt inline Toggle
- BikeExplorer: Tabs (Durchsuchen / Favoriten / Vergleich)
- StatsBar: Anzahl Treffer, Ø-Preis, Preisspanne, Händler-Anzahl
- Freshness-Indikator: "Daten vor X Stunden" + Cache-Badge

---

## Phase 2 – Adapter-Infrastruktur & Schema ✅

- `BikeSchema` (Zod) mit sourceId, sourceType, lastSeenAt, listPrice, offerPrice, availability
- `BaseAdapter` mit Health-Tracking, `stampAndRecord()`, konfigurierbarem `cacheTtlMs`
- Registry mit per-Adapter-Cache-Keys, fire-and-forget DB-Persistenz
- `AdapterHealth`-Interface, Admin-Adapter-Health-Dashboard (`/admin/adapters`)
- Adapter-Contract-Tests mit statischen HTML-Fixtures (Fahrrad XXL, Lucky Bike, Bike Discount)
- Freshness-Infrastruktur (`src/lib/freshness.ts`)
- In-Memory Sliding-Window Rate Limiter (`src/lib/rate-limit.ts`)

---

## Phase 3 – Vergleichsmotor & DB-Normalisierung ✅

- TypeScript-Port des Python-Vergleichsmotors (`src/lib/comparison.ts`):
  - Angebotsgültigkeit, per-Shop-Deduplication, günstigstes Angebot
  - 27 Tests (deckt alle 24 Python-Testfälle ab)
- Normalisiertes DB-Schema: Dealer → BikeModel → BikeListing → PriceSnapshot
- `bike-persistence.ts`: Upsert-Pipeline, automatische Preis-Snapshots bei Änderungen
- DB-first Strategie in `/api/bikes` (überlebt Serverneustarts)
- SavedBike-API: POST / GET / DELETE / PATCH mit Zod-Validierung, Optimistic UI
- API-Pagination: `?page=N&limit=N` (default 50, max 200)
- Error Boundaries: `error.tsx`, `global-error.tsx`, `admin/error.tsx`

---

## Phase 4 – Entity Resolution & Erweiterte Filter ✅

### Entity Resolution (`src/lib/entity-resolution.ts`)
- `groupBikes()`: Exaktes Matching per `canonicalKey` + Levenshtein Fuzzy-Matching (Union-Find)
- `BikeGroup`: bestPrice, highestPrice, dealerCount, isBestOffer, savings, confidence (`exact | fuzzy`)
- `BikeGroupCard`: Preiszeilen je Händler, "bis X € sparen"-Badge, Fuzzy-Warnung
- Neuer Tab "Modelle" im BikeExplorer mit Summary-Banner
- `GET /api/bikes/groups` Endpoint

### Erweitertes BikeSchema (neue technische Felder)
- `frameSize`, `wheelSize`, `driveType` (chain/belt/shaft), `gearCount`
- `batteryWh`, `motor`, `suspension` (rigid/front/hardtail/fully)
- `frameMaterial`, `color`, `modelYear`

### Erweitertes Filter-System (`src/lib/bike-filters.ts`)
- Multi-Select: `dealers[]`, `brands[]` (Pills statt Dropdown)
- `onlyDiscounted`-Toggle: Nur Angebote mit listPrice > price
- `availability`-Filter: aus Daten befüllt
- Technische Filter: `frameSizes[]`, `wheelSizes[]`, `driveTypes[]`, `suspensions[]`
- Akku-Bereich: `batteryWhMin` / `batteryWhMax`
- `frameMaterials[]`, `modelYears[]`
- Neue Sortieroptionen: `discount-desc`, `discount-abs-desc`, `battery-desc`, `year-desc`
- FilterSidebar: Einklappbare Sektionen (`FilterSection`-Komponente), scrollbare Desktop-Sidebar
- 218 Tests (alle grün)

---

## Phase 5 – Calculator, Rose Bikes & Bike24 ✅

### Steuerrechner (`src/lib/tax.ts`)
- `calculateBikeLease()`: Gehaltsumwandlung, geldwerter Vorteil, Steuerersparnis
- `estimateMonthlyGrossRate()`: Leasingrate aus UVP
- `useTaxProfile()`-Hook: Persönliches Steuerprofil (Gehalt, Steuerklasse, KiSt, AG-Zuschuss)
- `BikeCalculator`-Komponente: Echtzeit-Berechnung mit allen Steuerposten
- `CalcModal`: Dialog mit Calculator + einklappbarem Steuerprofil-Formular
- `TermTooltip`: Erklärungen für Fachbegriffe (Entgeltumwandlung etc.)
- BikeCard: "Rechner"-Button öffnet CalcModal mit vorausgefülltem Listenpreis
- BikeGrid: Netto-Rate unter jedem Bike, "Niedrigste Rate"-Badge
- Sortierung nach Netto-Rate (`netrate-asc / netrate-desc`)

### Neue Adapter
- **Rose Bikes** (`rose-bikes.ts`): CSS-Selector-Scraper, 6 Kategorien, 6h TTL
- **Bike24** (`bike24.ts`): React data-attribute Selektoren, 6 Kategorien, 6h TTL
- HTML-Fixtures + 12 Contract-Tests für beide Adapter
- 279 Tests gesamt (alle grün)

---

## Phase 6 – Weitere Händler-Adapter 🔄

### Ziel
Mehr echte Bikes im System. Aktuell liefern von 5 echten Adaptern nur Fahrrad XXL + Rose Bikes + Bike24 zuverlässig — Lucky Bike und Bike Discount sind wegen Client-Side-Rendering bzw. 403 eingeschränkt.

### Offen
- [ ] Lucky Bike: Alternative (API, Feed, Sitemap) suchen — Client-Side-Rendering blockiert Cheerio
- [ ] Bike Discount: Workaround für HTTP 403 finden (Proxy, andere Route)
- [ ] Weitere JobRad-Partner evaluieren (z.B. Specialized, Canyon Direct, Cube Store)
- [ ] `robots.txt` und AGB aller neuen Kandidaten prüfen
- [ ] Adapter-Gesundheitscheck im Admin-Dashboard — manuelle Aktualisierung auslösen

### Qualität
- [ ] Fixture-Tests bei HTML-Änderungen der Händlerseiten automatisch aktualisieren
- [ ] Warn-Benachrichtigung wenn Adapter 0 Bikes zurückliefert (Selektor veraltet)

---

## Phase 7 – Admin-Review, Monitoring & Skalierung ⏳

### Admin
- [ ] Review-Interface für unsichere Entity-Matches (confidence = `fuzzy`)
- [ ] Manuelle Zuordnung / Ablehnung von Bike-Gruppen
- [ ] Adapter manuell deaktivieren / reaktivieren
- [ ] Manuelle Cache-Invalidierung pro Adapter

### Monitoring
- [ ] Sentry (oder ähnliches) für Produktionsfehler
- [ ] Alert wenn Adapter > 2h keine Daten liefert
- [ ] Logging für Preis-Änderungen (PriceSnapshot-Historie nutzen)

### Performance & Skalierung
- [ ] Server-seitige Filterung wenn Datenmenge > ~1000 Bikes
- [ ] Virtuelle Scrolling-Liste für große Ergebnismengen
- [ ] Edge Caching für `/api/bikes` auf Vercel

### Sonstiges
- [ ] Resend-Setup (Domain-Verifikation, API-Key) für Magic-Link-Login in Produktion
- [ ] Product-Category-Abstraktion (siehe `docs/konzept-flexible-produktvergleiche.md`)
- [ ] Playwright E2E-Tests tatsächlich ausführen (Setup vorhanden, aber kein Test-Runner in CI)

---

## Bekannte Einschränkungen

| Problem | Ursache | Workaround |
|---------|---------|------------|
| Lucky Bike liefert 0 Bikes | Client-Side-Rendering | Adapter registriert, aber deaktiviert |
| Bike Discount liefert 403 | Anti-Bot-Schutz | Adapter registriert, aber deaktiviert |
| Entity Resolution zeigt `fuzzy` für Varianten | Gleiche Rahmengröße = neuer Eintrag | Admin-Review (Phase 7) |
| Netto-Rate basiert auf Schätzwerten | Employer-Parameter unbekannt | Nutzer setzt Steuerprofil manuell |
| Magic Link inaktiv | Resend nicht konfiguriert | Dev-Login via `ALLOW_DEV_LOGIN=true` |

---

## Technische Schulden

| Bereich | Beschreibung | Priorität |
|---------|-------------|-----------|
| `SavedBike.bikeData` | JSON-Blob (nicht normalisiert auf BikeListing) | Niedrig |
| Python-Referenzfiles | `models.py`, `compare.py` können entfernt werden | Niedrig |
| Playwright CI | E2E-Tests nicht in GitHub Actions integriert | Mittel |
| Per-User Rate Limiting | Aktuell nur per IP, nicht per authentifiziertem User | Mittel |
