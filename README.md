# Jembatan

Belajar bahasa Belanda langsung dari Indonesia (dan sebaliknya) — kartu kosakata A1 untuk kehidupan sehari-hari di Belanda, dengan pengulangan berjarak (SM-2).

UI chrome is localized with Next.js `[lang]` routing (`/id/...`, `/en/...`). Use the ID/EN toggle, or open `/en` to test in English. Flashcard content stays Indonesian ↔ Dutch.

## Stack

- Next.js (App Router) + React
- Postgres + Drizzle ORM
- Auth.js (email + kata sandi)

## Setup lokal

1. Salin env:

```bash
cp .env.example .env
```

Isi `AUTH_SECRET` (mis. `openssl rand -base64 32`) dan biarkan `DATABASE_URL` default jika pakai Docker di bawah.

2. Jalankan Postgres:

```bash
docker compose up -d
```

3. Migrasi + seed deck (~118 kartu) dan user opsional:

```bash
npm install
npm run db:migrate
npm run db:seed
```

4. Dev server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Akun seed (jika diisi di `.env`): lihat `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`.

## Skrip berguna

| Perintah | Fungsi |
|----------|--------|
| `npm run db:generate` | Buat migrasi dari schema |
| `npm run db:migrate` | Terapkan migrasi |
| `npm run db:seed` | Isi deck A1 + user seed |
| `npm run db:studio` | Drizzle Studio |

## Rute

- `/` — landing
- `/daftar` / `/masuk` — akun
- `/belajar` — sesi kartu (ID→NL / NL→ID)
- `/kemajuan` — ringkasan progres
