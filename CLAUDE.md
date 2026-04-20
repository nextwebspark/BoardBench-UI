# SeatRight-UI

Next.js 14 + Supabase app that renders a board-governance benchmarking dashboard ("BoardBench Module 1 — Board Composition"). Each project pins a focus company + 3–15 peers + a benchmark year; the dashboard renders 5 composition screens driven by percentile math over the filtered peer pool.

## Stack

- **Next.js 14** App Router, route groups `(auth)` / `(protected)`
- **React 19** (note: recharts requires `--legacy-peer-deps` and a direct `react-is` install)
- **Supabase** auth (`@supabase/ssr`) + Postgres with RLS on `projects`
- **Tailwind v4** — CSS-first, no `tailwind.config.ts`. Theme tokens live in [src/app/globals.css](src/app/globals.css) (`:root` light, `.dark` dark)
- **shadcn v4** on `@base-ui/react` (NOT Radix). No `asChild` prop
- **Zod v4** + `@hookform/resolvers@5`
- **TanStack Query** for client data, **TanStack Table** for tables
- **Recharts** for charts (donut on 1.2; rest of viz is Tailwind/SVG)

## Data model (read-only except `projects`)

Supabase tables (see [src/types/database.types.ts](src/types/database.types.ts)):

- `companies` — `id`, `company_name_value`, `country_value`, `sector_value` (used as "industry"), `sub_sector_value`, `exchange_value`, `company_code`
- `company_facts` — one row per `(company_id, year)`. JSONB `revenue`, `market_capitalisation`, `employees` in `{value, unit, currency}` shape
- `board_directors` — per-fact roster: `gender`, `director_type`, `local_expat`, `age`, `board_meetings_attended`, `total_fee`
- `board_committees` — per-fact committee memberships
- `projects` — benchmark projects with nullable `focus_company_id`, `peer_company_ids bigint[]`, `benchmark_year int`. RLS scoped to `user_id`

**Schema gotcha:** the column is `sector_value`, not `industry_value`. The benchmark layer maps `sector_value → metrics.industry` so screen code reads `.industry` consistently.

**Bigint note:** Postgres `bigint` → PostgREST → JS comes back as a string when large. `focus_company_id` / `peer_company_ids` / `companies.id` should be coerced with `Number()` before `===` comparison.

## Benchmarking architecture

Data flows server → client exactly once per page load. Filters are client-side state only.

- [src/lib/benchmark/types.ts](src/lib/benchmark/types.ts) — `CompanyMetrics`, `BenchmarkPool`, `Distribution`, `FilterState`, `MetricKey`
- [src/lib/benchmark/percentiles.ts](src/lib/benchmark/percentiles.ts) — pure helpers: `distributionFrom`, `distributionMapFrom`, `applyFilters`, `computePool`, `calcPercentile`. Min pool = 4; below that `computePool` falls back to full-universe distributions with `fallback: true`
- [src/lib/benchmark/fetch.ts](src/lib/benchmark/fetch.ts) — `server-only`. `fetchBoardMetrics(supabase, ids, year)` makes 3 queries (companies, facts, directors) and reduces them to `CompanyMetrics[]`. No SQL aggregates — fine for ≤16 companies per project

## Flow

1. `/projects/new` → [BenchmarkWizard](src/components/projects/BenchmarkWizard.tsx): pick focus (1) → pick 3–15 peers ranked by country/sector/exchange match (2) → name + year + description (3) → POST `/api/projects`
2. `/dashboard/[projectId]`:
   - [page.tsx](src/app/(protected)/dashboard/[projectId]/page.tsx) — server-side: load project, resolve year from `availableYearsFor`, call `fetchBoardMetrics`, split focus vs peers
   - [DashboardClient.tsx](src/app/(protected)/dashboard/[projectId]/DashboardClient.tsx) — client: holds `FilterState`, recomputes `BenchmarkPool` via `computePool`, dispatches to one of 5 screens
3. Screens in [src/components/benchmark/](src/components/benchmark/):
   - `BoardSizeScreen` (1.1), `IndependenceScreen` (1.2), `DiversityScreen` (1.6), `CompositionSnapshotScreen` (1.10), `CompositionScoreScreen` (1.11)
4. Primitives in [src/components/benchmark/primitives/](src/components/benchmark/primitives/): `GaugeBar`, `PercentileBadge`, `KpiStrip`, `InsightList`, `GapToMedianBars`

**Skills matrix (1.8) is out of scope** — `board_directors.skills` is free-text, not the structured peer dataset the ref prototype expects.

## Commands

```
npm run dev       # http://localhost:3000
npm run build     # production build + type check
npm run lint
```

When installing a new dep that has a React 18 peer, use `--legacy-peer-deps`.

## Conventions

- Never write to the DB outside the `projects` table. Reads must respect RLS (use the server-side Supabase client in [src/lib/supabase/server.ts](src/lib/supabase/server.ts))
- Theme tokens only — no hard-coded hex. Band colors: `emerald` = above P60, `sky` = P35–P60, `rose` = below P35, `amber` = warnings
- The reference prototype at `ref/boardbench_module1-vSolidDraft.html` is a visual source of truth. Diverge only when real data doesn't fit (e.g. omit tenure — no `tenure_years` column)
