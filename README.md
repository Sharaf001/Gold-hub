# Gold Shop

A gold jewellery storefront + admin dashboard.

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, wouter (routing)
- **Backend**: Node.js + Express 5, TypeScript, bundled with esbuild
- **Database**: PostgreSQL via Drizzle ORM
- **Validation**: Zod, generated (by hand, see note below) from an OpenAPI spec

This was exported from Replit as a partial project (only the editable
"artifacts" + `lib` folders came through — no workspace root, and two
packages the code depends on, `@workspace/api-zod` and
`@workspace/api-client-react`, were missing because they're normally
auto-generated from `lib/api-spec/openapi.yaml` via Orval). This
version has all of that reconstructed by hand so it runs standalone.
See **Notes on the reconstruction** at the bottom for details.

## Prerequisites

- Node.js 24+
- pnpm (see below if you don't have it)
- A PostgreSQL database (local install, or a free hosted one like Neon/Supabase)

Install pnpm if you don't have it (PowerShell):

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

or:

```powershell
npm install -g pnpm
```

## Setup (PowerShell)

From the project root:

```powershell
pnpm install
```

Set up your database connection:

```powershell
Copy-Item artifacts\api-server\.env.example artifacts\api-server\.env
notepad artifacts\api-server\.env   # paste in your real DATABASE_URL
```

Push the schema and seed some sample data (creates an admin user:
`admin` / `admin123`):

```powershell
pnpm run db:push
pnpm run db:seed
```

(Optional) Point the frontend at the API server explicitly — usually
only needed if you keep the defaults below:

```powershell
Copy-Item artifacts\gold-shop\.env.example artifacts\gold-shop\.env
```

## Running it

You need **two terminals** — one for the API, one for the frontend.

Terminal 1:

```powershell
pnpm run dev:api
```

Terminal 2:

```powershell
pnpm run dev:web
```

The API listens on `http://localhost:5000` and the frontend on
`http://localhost:5173`. Open `http://localhost:5173` in your browser.
Admin dashboard is at `/admin` (log in at `/login` with
`admin` / `admin123`).

## Other useful commands

```powershell
pnpm run typecheck   # typecheck every package
pnpm run build       # typecheck + build everything for production
```

## Notes on the reconstruction

- `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json` —
  didn't exist in the export; added so `pnpm install` resolves the
  workspace at all.
- `lib/db` — only had schema files. Added `package.json`,
  `drizzle.config.ts`, and the actual Drizzle/Postgres client
  (`src/index.ts`) that opens `DATABASE_URL` and exports `db`, plus
  a `seed.ts`.
- `lib/api-zod` and `lib/api-client-react` — these packages didn't
  exist at all; the real project generates them from
  `lib/api-spec/openapi.yaml` with Orval. I hand-wrote equivalents
  that match every schema/hook name the existing route and page
  files import, matching that same spec. If you'd rather have these
  generated for real, you can set up an `api-spec` workspace package
  with Orval and point it at the spec — the calling conventions here
  (`.mutate({ id, data })`, `useX(params, { query })`, etc.) match
  Orval's default output, so it should be a drop-in replacement.
- Removed duplicate/unused files: the export had two full sets of
  pages and a couple of components (e.g. `home.tsx` **and**
  `HomePage.tsx`, `navbar.tsx` **and** `Navbar.tsx`). Only the
  lowercase set is wired into `App.tsx` — the capitalized ones were
  dead code, and since they differ only by case, they'd silently
  collide on Windows/Mac's case-insensitive filesystem if kept.
- Added `cross-env` to the frontend/API dev scripts because
  `vite.config.ts` and `src/index.ts` both hard-require a `PORT` env
  var (and the frontend also requires `BASE_PATH`) — normally
  injected automatically by Replit, not present locally otherwise.
- Added `dotenv` loading to the API server and DB seed script so
  `.env` files are actually picked up outside of Replit.
- Dependency versions in `pnpm-workspace.yaml`'s `catalog` section
  are best-effort pins as of early 2026 — run `pnpm up --latest` if
  you want current versions.
