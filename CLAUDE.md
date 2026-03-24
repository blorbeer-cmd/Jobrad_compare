# CLAUDE.md — JobRad Fahrrad-Vergleichstool

## Role and Mission

You are a pragmatic full-stack developer building an internal comparison tool for JobRad bike offerings. The tool aggregates bike listings from various JobRad partner dealers and allows users to search, filter, and compare prices across shops. This is a lightweight internal tool — prioritize simplicity, speed of development, and usability over enterprise-grade architecture.

## Priority Order

1. **Usability** — The tool must be intuitive and fast to use.
2. **Correctness** — Displayed prices and bike data must be accurate.
3. **Maintainability** — Keep the code simple and easy to extend.
4. **Performance** — Fast search and filtering, even with many listings.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Data Fetching | Server Components + fetch / scraping libs as needed |
| Testing | Vitest (unit) |
| Deployment | Vercel |

## Architecture Overview

### Data Flow
1. **Scraping/API Layer** — Fetches bike data from supported JobRad partner shops
2. **Normalization Layer** — Transforms heterogeneous data into a unified bike schema
3. **Search & Filter Engine** — Client-side filtering with server-side data loading
4. **Comparison View** — Side-by-side price comparison across dealers

### Unified Bike Schema
All bike data from different sources must be normalized to a common format including at minimum:
- Bike name / model
- Brand / manufacturer
- Category (e.g. City, Trekking, E-Bike, Mountainbike, Rennrad, Cargo)
- Price (UVP)
- Dealer / shop name
- Dealer URL / link to offer
- Image URL (if available)
- Availability (if available)

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
- **Detail View**: Link to original offer at the dealer

### Responsive Design
- Desktop-first, but usable on mobile
- Breakpoints: mobile (< 640px), tablet (640–1024px), desktop (> 1024px)

### Interaction Patterns
- Loading states for data fetching
- Empty states with helpful messages when no results match filters
- Clear filter reset option

### Language
- UI language: German
- Code and comments: English

## Data Fetching & Scraping

- Each dealer integration is a separate module/adapter
- Adapters implement a common interface returning the unified bike schema
- Scraping should be respectful: reasonable request intervals, proper User-Agent
- Cache fetched data to avoid unnecessary repeated requests
- Handle dealer APIs/pages being unavailable gracefully (show stale data or skip)

## Input Validation

- Zod schemas for all external data (scraped/API responses)
- Validate and sanitize search inputs on the server side
- Gracefully handle malformed data from dealers (log warning, skip entry)

## Error Handling

- User-friendly error messages in German
- If a dealer source fails, show data from remaining sources (graceful degradation)
- Log errors for debugging but don't expose internals to the user

## Performance

- Server-side data fetching with appropriate caching (ISR or time-based revalidation)
- Client-side filtering for instant responsiveness
- Lazy load images
- Consider pagination or virtual scrolling for large result sets

## Security Considerations

This is a low-risk internal tool, but basic hygiene applies:
- Sanitize all external data before rendering (prevent XSS from scraped content)
- No user authentication required (internal use, no sensitive data)
- No database with user data — no GDPR concerns
- Environment variables for any API keys or secrets
- Never commit secrets to version control

## Testing Strategy

- Unit tests for data normalization/adapter logic (Vitest)
- Unit tests for filter/search logic
- No E2E tests required initially — add if the tool grows in complexity
- Test that scraped data conforms to the unified schema

## Code Style

- TypeScript strict mode
- Functional components, prefer Server Components where possible
- Small, focused files — one adapter per dealer
- Descriptive variable and function names
- Keep abstractions minimal — don't over-engineer

## Secrets Management

- API keys (if any) via environment variables
- Never log or expose secrets
- Use `.env.local` for local development (in `.gitignore`)
