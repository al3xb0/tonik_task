# TypeRacer Clone

Real-time typing competition platform built with Next.js — a TypeRacer-style game where players race against each other by typing text as fast and accurately as possible.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| State | Zustand |
| Backend / Realtime | Supabase (Realtime Broadcast + Postgres) |
| UI | shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| URL state | nuqs |
| Auth | Supabase Auth (Anonymous + Username upgrade) |
| Tests | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

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
  components/
    game/           # Game UI components (TypingInput, ProgressTable, etc.)
    stats/          # Statistics & leaderboard components
    ui/             # shadcn/ui components (auto-generated)
  stores/           # Zustand state management
  lib/
    supabase/       # Supabase client utilities
    game/           # Game logic (metrics, sentences)
  hooks/            # React hooks (auth, game round, realtime, typing)
  types/            # TypeScript type definitions
```

## License

MIT
