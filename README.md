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

3. Migrate + seed (~300 cards across A1 + A2, optional seed user):

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
| `/id/register`, `/en/register` | Register |
| `/id/login`, `/en/login` | Log in |
| `/id/study`, `/en/study` | Study session (`?deck=`, `?tag=`, `?direction=`) |
| `/id/progress`, `/en/progress` | Progress (`?deck=`) |
| `/id/offline`, `/en/offline` | Offline study fallback (PWA) |

Deck content lives in `content/decks/*.yaml` and is imported with `npm run db:seed`.

## Card audio (Google Chirp 3 HD)

Study cards can play pre-generated Indonesian / Dutch clips. Audio is **not** synthesized at runtime — generate once locally, commit the MP3s under `public/audio/`, and Vercel serves them as static files.

1. Create/select a GCP project and enable **Cloud Text-to-Speech API**.
2. Auth for the script (pick one):
   - Service account JSON: set `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` to the absolute path, or
   - Application Default Credentials: `gcloud auth application-default login`
3. Generate (skips files that already exist):

```bash
npm run audio:generate
```

Clips land at `public/audio/{id|nl}/{sha1}.mp3` using the same hash as the study speak button. Re-run after editing deck YAML so new/changed phrases get audio.

## PWA (phone home screen)

Production builds register a service worker (`public/sw.js`) and expose a web manifest for **Add to Home Screen**.

- Opening **Study** while online caches today’s due cards in IndexedDB.
- Ratings made offline are queued and sync when the network returns.
- Offline navigations fall back to `/id/offline` (or `/en/offline`).

Test with a production build (service worker is disabled in `next dev`):

```bash
npm run build && npm start
```

Then use Chrome DevTools → Application → Service Workers / Manifest, or install from the browser menu on your phone (HTTPS / Vercel).

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
| `AUTH_URL` | yes | Production alias, e.g. `https://jembatan-nu.vercel.app` |
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

Serverless functions run in **Frankfurt (`fra1`)** via [`vercel.json`](vercel.json), next to Neon (`eu-central-1`). Builds may still show `iad1` — that only affects the build machine, not request latency.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local next dev |
| `npm run build` | Production build |
| `npm run lint` | Biome check |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:seed` | Seed A1 + A2 decks (+ optional user) |
| `npm run db:studio` | Drizzle Studio |
| `npm run audio:generate` | Pre-generate Chirp 3 HD MP3s into `public/audio/` |

## Security notes

- Password minimum length is **8**.
- Security headers (CSP, frame deny, nosniff, etc.) are set in `next.config.ts`.
- DB client uses `max: 1` + `prepare: false` for serverless poolers.
