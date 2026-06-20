# Personal Monitor — Frontend (Next.js)

The web client for Personal Monitor. A mobile-first dashboard for health (BMI) tracking and finance (sources + transactions), talking to the FastAPI backend.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS + Inter (via `next/font`)
- `lucide-react` icons
- JWT stored in `localStorage`, sent as a Bearer token

## Setup

```bash
cd personal-monitor-frontend
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the backend
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Run

```bash
npm run dev
```

Open http://localhost:3000. Make sure the backend is running on the URL above and that you've created a user via the backend `/register` endpoint.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — lint

## Structure

```
app/
  layout.tsx      Root layout + metadata
  page.tsx        Dashboard: auth state, data fetching, tab routing
  globals.css     Tailwind + glass-card utility
components/
  Login.tsx
  HealthMonitor.tsx
  FinanceTracker.tsx
  Settings.tsx
lib/
  api.ts          Fetch client + token helpers
  types.ts        Shared TypeScript types
```
