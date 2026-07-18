# Jembatan

Indonesian ↔ Dutch flashcards (A1 daily life in the Netherlands) with SM-2 spaced repetition.

UI chrome is localized via Next.js `[lang]` routing (`/id/...`, `/en/...`). Flashcard content stays Indonesian ↔ Dutch.

## Stack

- Next.js (App Router) + React
- Postgres + Drizzle ORM
- Auth.js (email + password)
- Sentry (optional, production)

## Local setup

1. Copy env:

```bash
cp .env.example .env.local
```

Set `AUTH_SECRET` (`openssl rand -base64 32`). Keep `DATABASE_URL` for Docker below.

2. Start Postgres:

```bash
docker compose up -d
```

3. Migrate + seed (~118 cards, optional seed user):

```bash
npm install
npm run db:migrate
npm run db:seed
```

4. Dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/id` or `/en`).

## Routes

| Path | Purpose |
|------|---------|
| `/id`, `/en` | Landing |
| `/id/daftar`, `/en/daftar` | Register |
| `/id/masuk`, `/en/masuk` | Log in |
| `/id/belajar`, `/en/belajar` | Study session |
| `/id/kemajuan`, `/en/kemajuan` | Progress |

## Deploy on Vercel

### 1. Database (Neon)

This repo is wired for Neon (see `.neon` for org/project ids).

```bash
# Refresh connection strings into .env.local
npx neonctl@latest env pull

# Migrate + seed (drizzle-kit prefers DATABASE_URL_UNPOOLED)
npm run db:migrate
npm run db:seed
```

Copy the **pooled** `DATABASE_URL` from `.env.local` into Vercel.  
Do **not** run migrate on every Vercel build.

### 2. Vercel environment variables

Set for **Production** and **Preview**:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | yes | Neon pooled URL |
| `AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `AUTH_URL` | yes | Production alias, e.g. `https://jembatan-nielsvanhoofs-projects.vercel.app` |
| `SENTRY_DSN` | no | Server/edge errors |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Browser errors (often same as DSN) |
| `SENTRY_AUTH_TOKEN` | no | Source maps on build |
| `SENTRY_ORG` / `SENTRY_PROJECT` | no | With auth token |

### 3. Sentry (optional)

1. Create a Next.js project in [Sentry](https://sentry.io).
2. Add DSN (+ optional auth token for source maps) to Vercel.
3. For GitHub Actions source maps, set repo secret `SENTRY_AUTH_TOKEN` (Settings → Secrets → Actions). Never commit the token.
4. Redeploy. Errors from `error.tsx` / `global-error.tsx` and server requests are reported when a DSN is set.

### 4. Deploy

Connect the GitHub repo to Vercel (framework: Next.js). Build command: `npm run build` (default).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local next dev |
| `npm run build` | Production build |
| `npm run lint` | Biome check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:seed` | Seed A1 deck (+ optional user) |
| `npm run db:studio` | Drizzle Studio |

## Security notes

- Password minimum length is **8**.
- Security headers (CSP, frame deny, nosniff, etc.) are set in `next.config.ts`.
- DB client uses `max: 1` + `prepare: false` for serverless poolers.
