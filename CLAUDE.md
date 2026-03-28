# CLAUDE.md — JobRad Fahrrad-Vergleichstool

## Role and Mission

You are a pragmatic full-stack developer building a comparison tool for JobRad bike offerings. The tool aggregates bike listings from various JobRad partner dealers and allows registered users to search, filter, compare prices, and save favorites. Prioritize usability and correctness while maintaining proper security and GDPR compliance for user data.

## Priority Order

1. **Usability** — The tool must be intuitive and fast to use.
2. **Correctness** — Displayed prices and bike data must be accurate.
3. **Security & Privacy** — User data must be handled securely and GDPR-compliant.
4. **Maintainability** — Keep the code simple and easy to extend.
5. **Performance** — Fast search and filtering, even with many listings.

## Project Status

### Completed (Phases 1–3 + Phase 0)
- **Project Setup**: Next.js 16 with TypeScript strict, Prisma 7 + PostgreSQL (Neon), Tailwind CSS + shadcn/ui, Zod validation, Vitest, security headers, environment validation
- **Authentication & Authorization**: NextAuth.js v4 with Magic Link (EmailProvider + Resend ready), CredentialsProvider dev-login (behind `ALLOW_DEV_LOGIN=true`), invite system (7-day expiry), admin role (ADMIN_EMAIL auto-promotion), GDPR consent fields on User model, JWT strategy for dev login
- **UI Components**: 13 shadcn/ui base components, BikeExplorer with grid/filter/comparison views (Browse/Favoriten/Vergleich tabs), admin dashboard (users, invites, stats), login page with dev-login support, user navigation
- **Adapter Infrastructure**: Base adapter class, adapter registry with caching, demo adapter (8 fake bikes), API route `/api/bikes`
- **BikeExplorer wired to API**: Fetches from `/api/bikes` and `/api/saved-bikes`, no more hardcoded demo data
- **Favorites with persistence**: Save/unsave via API (`/api/saved-bikes`), optimistic UI, inline note editor, Zod-validated
- **GDPR Features**: Account deletion (`/api/account` DELETE, Art. 17), data export (`/api/account/export` GET, Art. 20), privacy policy page (`/datenschutz`), user profile page (`/profil`)
- **Filter Logic**: Extracted to `src/lib/bike-filters.ts` for testability, `FilterValues` as single source of truth
- **Test Suite**: 95 tests across 5 files (utils, adapter types, base adapter, bike filters, saved-bikes API)
- **DevOps**: Dockerfile, docker-compose (dev + prod), GitHub Actions CI/CD (lint, typecheck with prisma generate, test, build), Vercel config with `prisma db push` in build command
- **Health Check**: `/api/health` endpoint showing DB connectivity and env var status
- **Long-term Vision**: Concept document for flexible product comparison platform (`docs/konzept-flexible-produktvergleiche.md`) — bike tool first, then abstract to support graphics cards, motherboards, etc.

### Deployment Status
- **Vercel**: Configured, builds run `prisma generate && prisma db push && next build`
- **Neon DB**: Connection string set in Vercel env vars
- **CRITICAL**: Verify that `prisma db push` succeeds on next deploy — previous deploys had `--skip-generate` flag (invalid in Prisma 7) which was silently failing. Fixed in commit `1b9aaac`. If tables still don't exist after deploy, check Vercel build logs for the `prisma db push` output.
- **Dev Login**: Works when `ALLOW_DEV_LOGIN=true` is set in Vercel env vars and DB tables exist. Any email address works, no invite needed.
- **Magic Link (Resend)**: EmailProvider configured but Resend not yet set up. Needs: Resend API key, verified domain, `EMAIL_FROM` env var.

### In Progress (Phase 4)
- Real dealer adapter implementations (Fahrrad XXL, Lucky Bike, Bike Discount) — scaffolded but parsing logic not implemented
- Bike schema needs extension (sourceId, sourceType, lastSeenAt, listPrice/offerPrice)
- Adapter interface needs health status reporting and per-adapter cache TTL
- Per-adapter cache TTL (currently hardcoded 15min global, target 6–24h configurable)
- Freshness indicator in UI (cache infrastructure exists, UI doesn't show it)
- Port comparison logic from Python reference to TypeScript (see below)

### Not Started (Phase 5+)
- Database normalization (Dealer, BikeModel, BikeListing, PriceSnapshot tables)
- Entity Resolution / Matching layer
- Content-Security-Policy header (other security headers are in place)
- Rate limiting on any endpoint
- API pagination
- Error boundary components
- Monitoring/alerting (Sentry etc.)
- Adapter contract tests / HTML fixtures
- E2E tests (Playwright)
- Resend email setup (domain verification, API key)
- Product category abstraction (see `docs/konzept-flexible-produktvergleiche.md`)

### Known Compliance Gaps (CLAUDE.md vs. Code)

| Requirement | Status | Blocked by |
|-------------|--------|------------|
| Content-Security-Policy header | ❌ Missing | — |
| Rate limiting (auth + API) | ❌ Missing | — |
| Bike schema fields (sourceId, sourceType, lastSeenAt) | ❌ Missing | Phase 4 |
| Adapter health/status reporting | ❌ Missing | Phase 4 |
| Per-adapter cache TTL (6–24h) | ❌ Hardcoded 15min global | Phase 4 |
| Freshness indicator in UI | ❌ Infra exists, UI missing | Phase 4 |
| Normalized data model | ❌ SavedBike uses JSON blob | Phase 5 |
| Entity matching / deduplication | ❌ Not started | Phase 5 |
| Adapter contract tests / HTML fixtures | ❌ Not started | Phase 4 |
| E2E tests (Playwright) | ❌ Not started | Phase 5 |

### Reference Code (Python)
The files `models.py`, `compare.py`, and `tests/test_shop_offer_comparisons.py` contain a **Python prototype** of the offer comparison logic, built by a separate agent. This includes:
- Offer validity checks (active, date range, expiry)
- Per-shop deduplication (latest valid offer wins)
- Cheapest offer identification
- 24 pytest tests covering edge cases

This logic should be **ported to TypeScript** as part of the comparison engine in Phase 4/5. The Python files are kept as reference until the port is complete, then removed.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Fullstack | Next.js (current stable, App Router) + TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Auth | Auth.js / next-auth (Magic Link) |
| Scraping | Cheerio |
| Testing | Vitest (unit), Playwright (E2E when needed) |
| Deployment | Vercel + Neon (PostgreSQL) / Docker |

**Actual versions in use**: Next.js 16.2.1, React 19.2.4, Prisma 7.6.0, next-auth 4.24.13, TypeScript 6.0.2

**Note**: The Next.js app in `src/` is the single canonical frontend. Useful patterns from the former Vite prototype (grid/table view toggle, best-offer highlighting, price display with monthly rate vs. total price) should be adopted in the Next.js components.

## Architecture Overview

### Data Flow
1. **Data Acquisition Layer** — Fetches bike data from supported JobRad partner shops via APIs or scraping
2. **Normalization Layer** — Transforms heterogeneous data into a unified bike schema
3. **Entity Resolution / Matching Layer** — Groups dealer listings into comparable bike models (same bike across different dealers)
4. **Search & Filter Engine** — Server-side data loading, client-side filtering for small result sets; switch to server-side filtering if data volume grows
5. **Comparison View** — Side-by-side price comparison across dealers
6. **User Features** — Saved bikes, favorites, personal notes (requires auth)

### Entity Resolution / Matching

This is the core logic that makes the tool a real comparison tool rather than just a listing aggregator:
- Group listings from different dealers that represent the same bike model
- Handle variations in naming, spelling, frame sizes, colors, model years
- Use matching confidence scores to flag uncertain matches for review
- Key matching fields: brand + model name + model year + category + frame type

### Data Model (Target)

The data model should be normalized to support proper comparison:

| Table | Purpose |
|-------|---------|
| **Dealer** | Known dealer/shop with name, URL, adapter config |
| **BikeModel** | Canonical bike entity (brand, model, category, year) |
| **BikeListing** | Concrete offer from a dealer for a BikeModel |
| **PriceSnapshot** | Price history per listing (enables tracking changes) |
| **SavedBike** | User's saved/favorited listing with optional note |
| **User** | Auth user with GDPR fields |
| **Invite** | Invite-only registration |

**Current state**: SavedBike stores `bikeData` as JSON blob. Normalize to BikeListing/BikeModel/Dealer when implementing real adapters.

### Unified Bike Schema

All bike data from different sources must be normalized to a common format:

**Required fields:**
- `sourceId` — Unique ID from the source (dealer SKU / offer ID)
- `sourceType` — `api` | `scrape` | `manual`
- Bike name / model
- Brand / manufacturer
- Category (City, Trekking, E-Bike, Mountainbike, Rennrad, Cargo, Gravel, Kinder, Sonstige)
- `listPrice` — UVP / Listenpreis in EUR
- Dealer / shop name
- Dealer URL / link to offer
- `lastSeenAt` — Timestamp when last confirmed available

**Optional fields (extend as data becomes available):**
- `offerPrice` — Actual offer price if different from list price
- `canonicalModelKey` — Key for matching same model across dealers
- `modelYear`
- `frameType` / frame size / color
- `motor` / `batteryWh` (for E-Bikes)
- `groupset` / `suspension`
- Image URL
- Availability status
- `shippingAvailable` / `location`
- `currency` (default: EUR)

**Note on monthly rates**: JobRad monthly rates depend on employer-specific parameters (salary conversion, subsidies, insurance packages). The tool shows and compares list/offer prices. A rate calculator may be added later as a separate optional feature.

## Data Acquisition Policy

This is the biggest project risk. JobRad partner shops are numerous and have no central API.

### Rules
- **Prefer official APIs, feeds, or exports** over scraping wherever available
- **Only scrape publicly accessible pages** if legally and contractually permitted
- **Check robots.txt, site terms, and anti-bot restrictions** before enabling an adapter
- **Respect rate limits**: reasonable request intervals, proper User-Agent header
- Each adapter must define: fetch cadence, cache TTL, source health checks, and fallback behavior
- **Persist raw source payloads** (HTML snapshots) for debugging and parser regression tests where legally permissible
- Handle dealer pages being unavailable gracefully (show stale data with freshness indicator, or skip)

### Adapter Contract
Each dealer adapter is a separate module implementing a common interface:
- Returns normalized bike listings conforming to the unified schema
- Reports its health status and last successful fetch time
- Handles errors without crashing other adapters
- Logs warnings for malformed data (skip entry, don't fail)

### Caching Strategy
- Dealer data: revalidate every 6–24 hours (configurable per adapter)
- Manual refresh capability for operators
- Track `lastFetchedAt` and `lastSeenAt` per listing
- Show freshness indicator in UI (e.g. "Daten von vor 2 Stunden")
- Stale data is better than no data — show with warning

## Authentication & User Management

### Authentication
- Auth.js / next-auth v4 with email-based Magic Link login (EmailProvider, Resend ready but not active)
- CredentialsProvider "dev-login" behind `ALLOW_DEV_LOGIN=true` — any email works, auto-creates user, no invite needed
- JWT session strategy when dev login is active, database strategy otherwise
- Secure, HttpOnly, SameSite=Strict session cookies
- Session timeout: configurable (default: 7 days)
- Invite-only registration for production (admin sends invite links); bypassed in dev-login mode

### User Features
- **Saved Bikes / Favorites**: Users can save bikes to a personal list
- **Notes**: Optional personal notes on saved bikes
- **Comparison Lists**: Save and share comparison sets
- **Profile**: Minimal profile (display name, email)

### Authorization
- Two roles: `USER` (default) and `ADMIN`
- All user-specific data (favorites, notes) is scoped to the authenticated user
- Users must not be able to access other users' saved data
- Admin capabilities: manage invites, view users, operator functions

### Operator / Admin Capabilities
Even without a full admin panel, the following operational capabilities are needed:
- View adapter status (last fetch, error count, listing count)
- View recent fetch errors
- Temporarily disable a source/adapter
- Trigger manual cache refresh
- Review uncertain entity matches (matching confidence < threshold)

## Privacy & GDPR Compliance

Since the tool stores user data (email, saved preferences), GDPR applies.

### Lawful Basis
- Define and document the lawful basis for each processing activity (contract performance for account features, legitimate interest for operational logging)
- Provide a clear privacy notice during registration explaining what data is stored and why
- Do not rely solely on consent where another lawful basis is more appropriate

### Data Minimization
- Only collect what is necessary: email (for auth), display name (optional), saved bikes, notes
- No tracking, analytics, or profiling

### User Rights
- **Right to Access (Art. 15)**: Users can view all their stored data in their profile
- **Right to Deletion (Art. 17)**: Users can delete their account and all associated data
- **Right to Data Portability (Art. 20)**: Users can export their saved bikes/notes

### Data Retention
- User data is deleted when the account is deleted
- No data retained after account deletion except anonymized logs

### Privacy Policy
- A simple privacy policy page explaining data handling
- Accessible from registration and footer

## Database Design

### Core Tables (Current)
- **User**: id, email, name, role (USER/ADMIN), consentGiven, consentAt, createdAt, updatedAt
- **Account**: NextAuth.js managed (OAuth/credentials)
- **Session**: NextAuth.js managed (sessionToken, userId, expires)
- **Invite**: id, email, invitedBy, usedAt, expiresAt
- **SavedBike**: id, userId, bikeData (JSON), dealer, note, createdAt, updatedAt
- **VerificationToken**: NextAuth.js managed

### Target Tables (when normalizing for real adapters)
- **Dealer**: id, name, url, adapterKey, isActive, lastFetchedAt
- **BikeModel**: id, brand, modelName, category, canonicalKey, modelYear
- **BikeListing**: id, bikeModelId, dealerId, sourceId, listPrice, offerPrice, url, imageUrl, availability, lastSeenAt
- **PriceSnapshot**: id, bikeListingId, price, recordedAt

### Principles
- All user-scoped tables include `userId` foreign key
- Cascade delete: deleting a user removes all their saved data
- Prisma migrations for all schema changes
- Indexes on foreign keys and frequently queried columns

## UI/UX Standards

### Design Principles
- Clean, functional design — this is a utility tool, not a marketing site
- Mobile-friendly but desktop-first (primary use case is at work)
- Fast filtering without page reloads

### Core Features
- **Search**: Free-text search across bike name, brand, model
- **Filters**: Category, price range, brand, dealer
- **Sorting**: By price (asc/desc), name, dealer
- **Comparison**: Show same/similar bikes across different dealers
- **Favorites**: Save bikes with one click (heart icon), view saved list
- **Detail View**: Link to original offer at the dealer
- **Freshness Indicator**: Show when dealer data was last updated
- **View Toggle**: Grid view and table view for comparison results
- **Best Offer Highlight**: Visually mark the cheapest offer across dealers

### Responsive Design
- Desktop-first, but usable on mobile
- Breakpoints: mobile (< 640px), tablet (640–1024px), desktop (> 1024px)

### Interaction Patterns
- Loading states for data fetching
- Empty states with helpful messages when no results match filters
- Clear filter reset option
- Optimistic UI for save/unsave actions

### Language
- UI language: German
- Code and comments: English

## Input Validation

- Zod schemas for all external data (scraped/API responses)
- Zod schemas for all user inputs (search, notes, profile updates)
- Server-side validation on all API routes
- Gracefully handle malformed data from dealers (log warning, skip entry)

## Error Handling

- User-friendly error messages in German
- If a dealer source fails, show data from remaining sources (graceful degradation)
- Log errors for debugging but don't expose internals to the user
- Authentication errors: clear messages, redirect to login

## Performance

- Server-side data fetching with caching (time-based revalidation per adapter)
- Client-side filtering for small result sets; server-side query/filter/sort for large datasets
- Lazy load images
- Pagination or virtual scrolling for large result sets

## Security

### Basics
- HTTPS only (enforced by Vercel)
- Sanitize all external data before rendering (prevent XSS from scraped content)
- Environment variables for all secrets and API keys
- Never commit secrets to version control

### Authentication Security
- Secure session handling via Auth.js / next-auth
- CSRF protection (built into next-auth)
- Rate limiting on login and magic-link endpoints

### API Security
- All user-data API routes require authentication
- Validate that users can only access their own data
- Zod validation on all request bodies
- Rate limiting on save/favorite, compare/share, and search endpoints

### HTTP Security Headers
- Content-Security-Policy
- Permissions-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

## Testing Strategy

### Current Test Coverage
- **TypeScript (Vitest)**: 95 tests across 5 files:
  - `src/lib/utils.test.ts` — `cn()` utility
  - `src/adapters/types.test.ts` — Bike type/schema validation
  - `src/adapters/base-adapter.test.ts` — Base adapter class
  - `src/lib/bike-filters.test.ts` — Filter/sort logic
  - `src/app/api/saved-bikes/saved-bikes.test.ts` — SavedBike API routes
- **Python (pytest)**: 24 tests for offer comparison logic (`tests/test_shop_offer_comparisons.py`) — reference implementation, to be ported

### Target Test Coverage

#### Unit Tests (Vitest)
- Data normalization / adapter logic
- Filter / search logic
- API route authorization (user can only access own data)
- Entity matching / deduplication logic
- Comparison logic (port from Python tests)

#### Adapter Contract Tests
- Each adapter returns data conforming to the unified bike schema
- HTML fixture tests against saved example pages (detect when site structure changes)
- Graceful handling of malformed or missing data

#### E2E Tests (Playwright)
- Login flow (magic link)
- Search and filter
- Save/unsave favorites
- Comparison view
- Admin dashboard access

## Code Style

- TypeScript strict mode
- Functional components, prefer Server Components where possible
- Small, focused files — one adapter per dealer
- Descriptive variable and function names
- Keep abstractions minimal — don't over-engineer

## Version Policy

**Never rely on training data for version information.** AI training data is outdated and may reference wrong or non-existent versions.

- When adding, upgrading, or recommending a dependency: **always verify the current stable version** via `npm view <package> version`, official docs, or a web search
- When writing documentation or config that references a framework/tool version: verify it first
- When a user asks about a version or compatibility: look it up, don't guess
- If a version cannot be verified (e.g. no internet access): state clearly that the version was not verified and recommend the user check manually

## Development Workflow

### Pre-Push Validation (REQUIRED before every push)
Run these steps before pushing to avoid deployment failures:
1. `git fetch origin main && git merge origin/main --no-edit` — check for conflicts
2. `npx prisma generate` — generate Prisma client
3. `npx tsc --noEmit` — type check
4. `npx next build` — full build check
5. `npx vitest run` — run all tests

### Prisma 7 Specifics
- **No `url` in schema.prisma**: Prisma 7 requires datasource URL in `prisma.config.ts`, NOT in `schema.prisma`. Adding `url = env("DATABASE_URL")` to the schema will cause a validation error.
- **`prisma.config.ts`**: Defines `datasource.url` from `process.env.DATABASE_URL`
- **`--skip-generate` removed**: This flag does not exist in Prisma 7. Use plain `prisma db push`.
- **PrismaPg adapter**: Runtime uses `@prisma/adapter-pg` with `PrismaPg` in `src/lib/db.ts`
- **Generated client**: Output to `src/generated/prisma` (configured in schema.prisma generator block)
- **Imports**: Use `@/generated/prisma/client` for PrismaClient, `@/generated/prisma/enums` for Role etc.

### Environment Variables (Vercel)
- `DATABASE_URL` — Neon PostgreSQL connection string (required)
- `NEXTAUTH_URL` — App URL (required)
- `NEXTAUTH_SECRET` — Auth secret (required)
- `ADMIN_EMAIL` — Auto-promoted to ADMIN role (required)
- `ALLOW_DEV_LOGIN` — Set to `true` to enable CredentialsProvider dev login (optional, for testing)
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` — For Resend magic link (not yet active)

### The user does not work locally
All development goes through Vercel deployments. There is no local dev environment. Database operations (like `prisma db push`) must happen during the Vercel build.

## Secrets Management

- All secrets (DB connection, NextAuth secret, API keys) via environment variables
- Validated at startup (fail fast if missing)
- Never log or expose secrets
- Use `.env.local` for local development (in `.gitignore`)
