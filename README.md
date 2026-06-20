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
- `npm run test` — run unit tests once (Vitest)
- `npm run test:watch` — run tests in watch mode

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

## Testing

Unit tests use **Vitest** + **React Testing Library** (jsdom environment).

```bash
npm run test          # run once
npm run test:watch    # watch mode
```

Current coverage: the API client (token handling, login, 401 behavior, auth
headers) and the `Login` component.

### Run checks automatically before every push

A `pre-push` git hook lives in `.githooks/`. Enable it once per clone:

```bash
git config core.hooksPath .githooks
# macOS/Linux only: make it executable
chmod +x .githooks/pre-push
```

`git push` then runs `npm run lint` and `npm run test` first, aborting the push
if anything fails.

## Deployment (Netlify) & CI/CD

This repo deploys to **Netlify** and runs CI on **GitHub Actions**.

### One-time setup

1. Push this repo to GitHub.
2. On Netlify: **Add new site → Import from Git**, connect the repo. Netlify
   reads `netlify.toml` (build command, Node version, and the official
   `@netlify/plugin-nextjs` runtime) automatically.
3. Set the environment variable **`NEXT_PUBLIC_API_URL`** (Site settings →
   Environment variables) to your Render backend URL, e.g.
   `https://personal-monitor-backend.onrender.com`. This is inlined at build
   time, so a redeploy is needed if you change it.
4. Add your Netlify site URL to the backend's `CORS_ORIGINS` on Render.

### How CI/CD works

- `.github/workflows/ci.yml` runs on every push/PR to `master`: `npm ci`,
  `npm run lint`, `npm run test`, and `npm run build`.
- **Deploy** is handled by Netlify's native auto-deploy on push to `master`.
- *(Optional, gated deploy)* To only deploy after CI passes: turn **off**
  automatic builds in Netlify, create a **Build Hook** URL, and add it as a
  GitHub Actions secret named `NETLIFY_BUILD_HOOK_URL`. You can also set
  `NEXT_PUBLIC_API_URL` as a repo secret so CI builds against the real backend.
