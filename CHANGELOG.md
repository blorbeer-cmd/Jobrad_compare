# Changelog

Alle Aenderungen am Projekt werden hier dokumentiert.

## [0.5.0] - 2026-03-25

### Phase 5: Deployment

#### Hinzugefuegt
- Multi-Stage Dockerfile (Node 20 Alpine, non-root User, standalone Output)
- docker-compose.yml mit PostgreSQL 16 + App Service
- docker-compose.prod.yml als Production Override
- .dockerignore fuer optimierten Build-Context
- GitHub Actions CI (Lint, TypeCheck, Test, Build) und Deploy (Docker Push zu GHCR)
- next.config.js: standalone Output, HSTS, Permissions-Policy
- vercel.json mit buildCommand (prisma generate + next build)

## [0.4.0] - 2026-03-25

### Phase 4: Haendler-Adapter

#### Hinzugefuegt
- BaseAdapter abstrakte Klasse (fetchPage, mapCategory, parsePrice, extractBrand)
- In-Memory Cache mit TTL (15 Min)
- Adapter-Registry mit Promise.allSettled
- FahrradXXLAdapter, LuckyBikeAdapter, BikeDiscountAdapter (Cheerio HTML-Scraping)
- DemoAdapter mit 16 Fahrraedern
- API: GET /api/bikes, GET /api/bikes?refresh=true
- API: GET/DELETE /api/bikes/cache (Admin)
- BikeExplorer fetcht live von API mit Loading/Error/Refresh
- cheerio Dependency, USE_DEMO_ADAPTERS Env-Variable

## [0.3.0] - 2026-03-24

### Phase 3: Modernes UI (User + Admin)

#### Hinzugefuegt
- 13 shadcn/ui Basiskomponenten
- BikeCard, BikeGrid, FilterSidebar, ComparisonView, ComparisonBar, StatsBar
- BikeExplorer mit Tabs, Filtern, Vergleich
- Admin Dashboard mit Stats, Benutzerverwaltung
- Einladungsseite verbessert, Login-Seite Redesign, UserNav als Dropdown

## [0.2.0] - 2026-03-24

### Phase 2: Authentifizierung (Magic Link + Invite-System)

#### Hinzugefuegt
- NextAuth.js mit Email-Provider (Magic Link)
- Invite-System mit Admin-Verwaltung
- Auth-Guards, SessionProvider, UserNav

## [0.1.0] - 2026-03-24

### Phase 1: Projekt-Setup

#### Hinzugefuegt
- Next.js 14, TypeScript, Prisma, Tailwind, shadcn/ui, Zod, Vitest
- DealerAdapter Interface, Security Headers, Env-Validierung
