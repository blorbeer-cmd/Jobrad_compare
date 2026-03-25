# CLAUDE.md — JobRad Fahrrad-Vergleichstool

## Role and Mission

You are a pragmatic full-stack developer building a comparison tool for JobRad bike offerings. The tool aggregates bike listings from various JobRad partner dealers and allows registered users to search, filter, compare prices, and save favorites. Prioritize usability and correctness while maintaining proper security and GDPR compliance for user data.

## Priority Order

1. **Usability** — The tool must be intuitive and fast to use.
2. **Correctness** — Displayed prices and bike data must be accurate.
3. **Security & Privacy** — User data must be handled securely and GDPR-compliant.
4. **Maintainability** — Keep the code simple and easy to extend.
5. **Performance** — Fast search and filtering, even with many listings.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Fullstack | Next.js 14 (App Router) + TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma |
| UI | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Auth | NextAuth.js (Credentials or Magic Link) |
| Testing | Vitest (unit) |
| Deployment | Vercel + Neon (PostgreSQL) |

## Architecture Overview

### Data Flow
1. **Scraping/API Layer** — Fetches bike data from supported JobRad partner shops
2. **Normalization Layer** — Transforms heterogeneous data into a unified bike schema
3. **Search & Filter Engine** — Client-side filtering with server-side data loading
4. **Comparison View** — Side-by-side price comparison across dealers
5. **User Features** — Saved bikes, favorites, personal notes (requires auth)

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

## Authentication & User Management

### Authentication
- NextAuth.js with email-based login (Magic Link or Credentials provider)
- Secure, HttpOnly, SameSite=Strict session cookies
- Session timeout: configurable (default: 7 days)
- Only colleagues / invited users can register (invite-only or email domain restriction)

### User Features
- **Saved Bikes / Favorites**: Users can save bikes to a personal list
- **Notes**: Optional personal notes on saved bikes
- **Comparison Lists**: Save and share comparison sets
- **Profile**: Minimal profile (display name, email)

### Authorization
- Single role: authenticated user (no admin/role hierarchy needed initially)
- All user-specific data (favorites, notes) is scoped to the authenticated user
- Users must not be able to access other users' saved data

## Privacy & GDPR Compliance

Since the tool stores user data (email, saved preferences), GDPR applies:

### Data Minimization
- Only collect what is necessary: email (for auth), display name (optional), saved bikes, notes
- No tracking, analytics, or profiling

### Consent
- Clear privacy notice at registration explaining what data is stored and why
- Consent to data processing as part of the registration flow

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

### Core Tables
- **User**: id, email, name, createdAt, updatedAt
- **SavedBike**: id, userId, bikeData (JSON or normalized), dealerName, note, createdAt
- **Session**: managed by NextAuth.js

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

## Data Fetching & Scraping

- Each dealer integration is a separate module/adapter
- Adapters implement a common interface returning the unified bike schema
- Scraping should be respectful: reasonable request intervals, proper User-Agent
- Cache fetched data to avoid unnecessary repeated requests (time-based revalidation)
- Handle dealer APIs/pages being unavailable gracefully (show stale data or skip)

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

- Server-side data fetching with appropriate caching (ISR or time-based revalidation)
- Client-side filtering for instant responsiveness
- Lazy load images
- Consider pagination or virtual scrolling for large result sets

## Security

### Basics
- HTTPS only (enforced by Vercel)
- Sanitize all external data before rendering (prevent XSS from scraped content)
- Environment variables for all secrets and API keys
- Never commit secrets to version control

### Authentication Security
- Secure session handling via NextAuth.js
- CSRF protection (built into NextAuth.js)
- Rate limiting on login endpoints (prevent brute force)

### API Security
- All user-data API routes require authentication
- Validate that users can only access their own data
- Zod validation on all request bodies

### HTTP Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin

## Testing Strategy

- Unit tests for data normalization/adapter logic (Vitest)
- Unit tests for filter/search logic
- Unit tests for API route authorization (user can only access own data)
- Test that scraped data conforms to the unified schema
- Add E2E tests (Playwright) if the tool grows in complexity

## Code Style

- TypeScript strict mode
- Functional components, prefer Server Components where possible
- Small, focused files — one adapter per dealer
- Descriptive variable and function names
- Keep abstractions minimal — don't over-engineer

## Secrets Management

- All secrets (DB connection, NextAuth secret, API keys) via environment variables
- Validated at startup (fail fast if missing)
- Never log or expose secrets
- Use `.env.local` for local development (in `.gitignore`)
