# Changelog

Alle Aenderungen am Projekt werden hier dokumentiert.

## [0.5.0] - 2026-03-25

### Phase 5: Deployment

#### Hinzugefuegt

**Docker:**
- Multi-Stage Dockerfile (base, deps, builder, runner) mit Node 20 Alpine
- Non-root User (nextjs:nodejs) fuer Security
- Standalone Output fuer minimale Image-Groesse
- Prisma Generate im deps-Stage
- docker-compose.yml mit PostgreSQL 16 + App Service
- docker-compose.prod.yml als Production Override
- .dockerignore fuer optimierten Build-Context

**GitHub Actions CI/CD:**
- ci.yml: Lint, Type Check, Test, Build (parallel, dann Build)
- deploy.yml: Docker Build + Push zu GitHub Container Registry (ghcr.io)
- BuildX mit GitHub Actions Cache fuer schnellere Builds
- Image-Tags: sha, branch, latest

**next.config.js Updates:**
- `output: "standalone"` fuer Docker-kompatibles Build
- HSTS Header (Strict-Transport-Security)
- Permissions-Policy Header
- X-DNS-Prefetch-Control Header
- Image Remote Patterns fuer Haendler-Domains und placehold.co

**Vercel:**
- vercel.json mit buildCommand (prisma generate + next build)

**Deployment-Optionen:**
1. Docker: `docker compose up -d`
2. Docker Prod: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
3. Vercel: Automatisch via vercel.json
4. GHCR: Image wird bei Push auf main automatisch gebaut

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
- cheerio Dependency
- USE_DEMO_ADAPTERS Env-Variable

## [0.3.0] - 2026-03-24

### Phase 3: Modernes UI (User + Admin)

#### Hinzugefuegt
- 13 shadcn/ui Basiskomponenten
- BikeCard, BikeGrid, FilterSidebar, ComparisonView, ComparisonBar, StatsBar
- BikeExplorer mit Tabs, Filtern, Vergleich
- Admin Dashboard mit Stats, Benutzerverwaltung
- Einladungsseite verbessert
- Login-Seite Redesign
- UserNav als Dropdown

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
- DealerAdapter Interface
- Security Headers
- Env-Validierung
