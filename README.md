# Family tree

A private, invite-only family tree website. Next.js 16 (App Router, TypeScript), PostgreSQL via Drizzle ORM.

## Local setup

Requires Node 24 and Docker. pnpm is pinned in `package.json` and run through corepack, so no global install is needed.

```sh
cp .env.example .env                              # defaults match docker-compose.dev.yml
docker compose -f docker-compose.dev.yml up -d   # Postgres 17 on localhost:5432
corepack pnpm i
corepack pnpm exec playwright install chromium    # once, for end-to-end tests
corepack pnpm db:migrate
corepack pnpm dev                                 # http://localhost:3000
```

`GET /api/health` returns `{ "ok": true }` when the database answers.

## Scripts

| Script | What it does |
| --- | --- |
| `corepack pnpm check` | Runs `lint`, `typecheck`, `test` and `test:e2e`; must pass before merging |
| `corepack pnpm lint` | ESLint |
| `corepack pnpm typecheck` | Generates Next route types, then `tsc --noEmit` |
| `corepack pnpm test` | Vitest unit and integration tests (needs the database running) |
| `corepack pnpm test:e2e` | Playwright tests in Chromium; starts a dev server on port 3100 |
| `corepack pnpm db:generate` | Generates a SQL migration in `drizzle/` from `src/db/schema.ts` |
| `corepack pnpm db:migrate` | Applies pending migrations to `DATABASE_URL` |

Every database ID column is a UUID. Migrations are committed SQL files in `drizzle/`.
