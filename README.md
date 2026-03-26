# worldslop-example

Ingredient management web app built with Vite + React + TypeScript, Tailwind, and shadcn/ui.
Backend is fully Supabase (Postgres + Edge Functions).

## Stack

- Frontend: Vite, React 19, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Supabase Postgres + Supabase Edge Functions
- Deployment: GitHub Actions + Vercel (single project, branch-mapped environments)
- Package manager: pnpm

## Environments

Branch mapping is fixed:

- `main` -> `dev`
- `staging` -> `staging`
- `production` -> `prod`

Each environment must have:

- A separate Supabase project/database
- Matching Supabase API keys and service role key
- A Vercel deployment from the same Vercel project

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment template and fill with your dev Supabase values:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
pnpm dev
```

## Supabase setup (dev/staging/prod)

Create three Supabase projects in the same region (EU West / London):

- `worldslop-example-dev`
- `worldslop-example-staging`
- `worldslop-example-prod`

For each project collect:

- Project ref
- Project URL
- Anon key
- Service role key
- Database connection string (`postgresql://...`) for migration deploys

### Database schema and seed

Migrations are in [`supabase/migrations`](./supabase/migrations):

- `20260324173000_create_ingredients.sql`
- `20260324173100_seed_ingredients.sql`

### Edge Functions

Functions are in [`supabase/functions`](./supabase/functions):

- `ingredients-list` (`GET`)
- `ingredients-create` (`POST`)
- `ingredients-delete` (`DELETE`)

All functions are deployed with `--no-verify-jwt` and use `SUPABASE_SERVICE_ROLE_KEY`.

## Vercel setup (single team project)

1. Create/import one Vercel project for this repo (team scope).
2. In Vercel project settings, copy:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
3. Keep Vercel's default domain(s). No custom domain is required for initial setup.

## GitHub secrets required

Set these repo secrets:

### Shared

- `SUPABASE_ACCESS_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Dev (`main`)

- `DEV_SUPABASE_PROJECT_REF`
- `DEV_SUPABASE_DB_URL`
- `DEV_SUPABASE_URL`
- `DEV_SUPABASE_ANON_KEY`
- `DEV_SUPABASE_SERVICE_ROLE_KEY`

### Staging (`staging`)

- `STAGING_SUPABASE_PROJECT_REF`
- `STAGING_SUPABASE_DB_URL`
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`

### Prod (`production`)

- `PROD_SUPABASE_PROJECT_REF`
- `PROD_SUPABASE_DB_URL`
- `PROD_SUPABASE_URL`
- `PROD_SUPABASE_ANON_KEY`
- `PROD_SUPABASE_SERVICE_ROLE_KEY`

## CI/CD workflows

- [`ci.yml`](./.github/workflows/ci.yml): `typecheck`, `lint`, `build`
- [`deploy.yml`](./.github/workflows/deploy.yml): on push to `main|staging|production`
  - Applies Supabase migrations to mapped DB
  - Syncs function secrets and deploys Edge Functions
  - Runs a Supabase smoke check (`ingredients-list`)
  - Builds/deploys frontend to Vercel mapped environment

## Promotion commands

Promote `main` -> `staging`:

```bash
pnpm promote:staging
```

Promote `staging` -> `production`:

```bash
pnpm promote:prod
```

These commands:

- require a clean git working tree
- perform fast-forward promotion merges
- push target branch to origin (triggering deploy workflow)

## API contract

- `GET /functions/v1/ingredients-list` -> `{ ingredients: Ingredient[] }`
- `POST /functions/v1/ingredients-create` with body `{ name, category, quantity_value, quantity_unit }`
- `DELETE /functions/v1/ingredients-delete?id=<uuid>` -> `{ deletedId: string }`

`Ingredient` shape:

```ts
type Ingredient = {
  id: string
  name: string
  category: string
  quantity_value: number
  quantity_unit: string
  created_at: string
}
```
