# TypeRacer Clone

Real-time typing competition platform built with Next.js — a TypeRacer-style game where players race against each other by typing text as fast and accurately as possible.

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| Framework          | Next.js 16 (App Router)                      |
| Language           | TypeScript (strict mode)                     |
| State              | Zustand                                      |
| Backend / Realtime | Supabase (Realtime Broadcast + Postgres)     |
| UI                 | shadcn/ui + Tailwind CSS                     |
| Animations         | Framer Motion                                |
| URL state          | nuqs                                         |
| Auth               | Supabase Auth (Anonymous + Username upgrade) |
| Tests              | Vitest + React Testing Library               |
| Linting            | ESLint + Prettier                            |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)

### Installation

```bash
npm install
cp .env.local.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the SQL from `supabase/setup.sql` in Supabase Dashboard → SQL Editor. This creates all tables, RLS policies, triggers, the leaderboard RPC function, and seeds sentences.

Make sure **Anonymous sign-ins** are enabled in Supabase Dashboard → Settings → Auth.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Tests

```bash
npm run test
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

## Project Structure

```
src/
  app/              # Next.js App Router pages & API routes
    api/
      rounds/       # GET current/create game round
      stats/        # Player stats, leaderboard, round results
  components/
    game/           # Game UI (TypingInput, ProgressTable, RoundTimer, etc.)
    stats/          # Statistics & leaderboard tables
    auth/           # Account upgrade button
    ui/             # shadcn/ui components (auto-generated)
  stores/           # Zustand state management (gameStore, playerStore)
  lib/
    supabase/       # Supabase client utilities (browser, server, realtime)
    game/           # Game logic (metrics, sentences)
    rate-limit.ts   # In-memory rate limiter for API routes
  hooks/            # React hooks (useAuth, useGameRound, useRealtimePlayers, useTypingMetrics)
  types/            # TypeScript type definitions
```

## Architectural Decisions

- **Supabase Anonymous Auth**: Every visitor gets a real auth session automatically — no registration required. Game history is preserved across visits because `auth.users.id` stays the same. Users can upgrade to a permanent account (email/password) without losing history.

- **Broadcast vs Postgres Changes**: Live typing progress uses Supabase Realtime **Broadcast** instead of Postgres Changes. Broadcast is faster and doesn't create database writes for every keystroke. Only the final round result is persisted to `round_results`.

- **Throttle 300ms**: Typing updates are throttled to 300ms before broadcasting. This balances real-time feel with network efficiency.

- **Synchronized rounds via scheduled time**: Each round has a fixed `started_at` / `ended_at`. All clients compute `timeLeft` locally from the server timestamp — no master-client coordination required. Timer uses a 250ms interval for drift correction.

- **URL-persisted table state**: Sorting and pagination in the players table and leaderboard are stored in the URL via `nuqs`, making the table state shareable and bookmarkable.

- **Singleton Supabase client**: The browser-side Supabase client is cached as a module-level singleton to avoid creating multiple GoTrue/Realtime connections.

- **SQL-side leaderboard aggregation**: The leaderboard uses a Postgres RPC function (`get_leaderboard`) with `GROUP BY` aggregation instead of fetching all rows to JavaScript, with a JS-side fallback if the RPC isn't available.

- **In-memory rate limiting**: All API routes are protected by a simple sliding-window rate limiter. Suitable for single-instance deployments; for multi-instance, swap to Redis.

## What I Would Add in Production

- **Redis rate limiting** (e.g. Upstash) for distributed deployments
- **E2E tests** with Playwright for full user journeys
- **Monitoring & error tracking** with Sentry
- **Redis queues** for round scheduling instead of on-demand creation
- **Database indexes** on `round_results(player_id)` and `game_rounds(ended_at)` for query performance
- **CDN caching** for static assets and sentence lists
- **WebSocket reconnection UI** — show banner when Realtime connection drops
- **Anti-cheat measures** — server-side WPM validation, paste detection
- **Dark mode toggle** (currently supports dark mode via system preference only)
- **Internationalization (i18n)** for multi-language support

## Assumptions & Simplifications

- **Single-instance deployment**: The in-memory rate limiter and module-level singleton Supabase client assume a single Node.js process. For horizontal scaling, swap to Redis-based rate limiting and external session store.
- **Anonymous-first auth**: Users start as anonymous Supabase users. This simplifies onboarding but means abandoned anonymous accounts accumulate over time — a cleanup job would be needed.
- **Fixed round duration**: Rounds use a hardcoded 60-second timer. Configurable durations were out of scope.
- **Client-side sorting & pagination**: Tables sort and paginate in-memory on the client. This works well for the expected data sizes (≤100 leaderboard entries, ≤50 competitors) but wouldn't scale to thousands of rows without server-side pagination.
- **Realtime broadcast is fire-and-forget**: Typing updates sent via Supabase Broadcast have no delivery guarantee. A brief network hiccup may cause a competitor's progress to appear stale until the next update.

## License

MIT
