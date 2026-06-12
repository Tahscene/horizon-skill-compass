# Phase 3b — Admin Forecast Management & Student Analytics

## Routes (new + replace)

Replace placeholder `/admin` and add three children. Using flat dot-naming:

- `src/routes/_authenticated.admin.tsx` → real KPI dashboard (replaces placeholder)
- `src/routes/_authenticated.admin.forecasts.tsx` → CRUD table
- `src/routes/_authenticated.admin.students.tsx` → list of standard users
- `src/routes/_authenticated.admin.students.$userId.tsx` → read-only detail
- `src/routes/_authenticated.admin.logs.tsx` → activity log viewer

All four wrapped by a shared admin gate component (`AdminGate`) that returns "Access denied" unless `useAuth().role === 'admin'` (server-side enforcement remains via RLS — admin policies already exist on these tables).

## Sidebar

Expand the existing `Admin` group in `app-sidebar.tsx` to include: Overview, Forecasts, Students, Logs (each as a `SidebarMenuItem` under the existing admin group, visible only when `role === 'admin'`).

## /admin (Overview)

KPI cards:
1. Active forecasts → `count(*) where status='active'`
2. Total students → `count(*) from profiles` (filtered to standard_user via user_roles)
3. Recommendations generated → `count(*) from skill_recommendations`
4. Avg projected 5yr multiplier → `avg(projected_5yr_multiplier) where status='active'`

Recharts bar chart: avg multiplier per country (active only). Reuse the dashboard chart styling.

Data loading via TanStack Query (parallel `useQuery` calls against `supabase` browser client; admin RLS policy lets admins read all rows).

## /admin/forecasts (CRUD)

Table columns: country, skill_name, category, current_demand_index, projected_5yr_multiplier, status, updated_at, actions.

Controls:
- Search (skill_name ILIKE)
- Filter dropdowns: country, category, status (active/archived)
- Sort: clickable column headers (country, multiplier, updated_at)
- Pagination: 15/page

Create/Edit: shadcn `Dialog` with `react-hook-form` + `zod`:
- country (text, 2–60 chars)
- skill_name (required)
- category (required)
- current_demand_index (number 0–100)
- projected_5yr_multiplier (number 0.1–10, step 0.1)
- source_note (textarea, optional)
- status (select: active | archived)

Archive vs Delete: `AlertDialog` confirms. Archive sets `status='archived'`; Delete removes row. Both write to activity_log.

Audit trail — extend `src/lib/activity.ts` with an optional payload:
```ts
logActivity(action, entity, entityId, { old_value?, new_value? })
```
Insert old/new JSON into existing `activity_log` columns (already present per schema).

Actions logged: `forecast.created`, `forecast.updated`, `forecast.archived`, `forecast.deleted`.

## /admin/students

Query: `profiles` left-joined to `user_roles` filtered to `standard_user`, with `skill_recommendations` count via a `select('*, skill_recommendations(count)')` PostgREST embed.

Table: full_name, current_skill_area, education_level, saved count (status='saved'), total recs. Row click → navigate to `/admin/students/$userId`.

Detail page: read-only — profile header + list of all their `skill_recommendations` (using existing `RecommendationCard` in read-only mode — pass an `actionsHidden` prop and add that prop to the card so save/dismiss buttons hide). No mutations.

## /admin/logs

Table of `activity_log` joined to `profiles` (user name). Filters: action type select (distinct actions), text search on entity. Pagination 25/page. Render old/new JSON in collapsible row when present.

## Components (new)

- `src/components/admin/forecast-form-dialog.tsx` — create/edit dialog
- `src/components/admin/confirm-dialog.tsx` — generic alert wrapper
- `src/components/admin/kpi-card.tsx` — stat card
- `src/components/admin/admin-gate.tsx` — role guard wrapper

## Activity helper extension

`src/lib/activity.ts` updated signature is backward-compatible — extra param defaults to `{}`. All existing Phase 3a calls keep working.

## Validation walkthrough

1. Sign in as standard_user → visit `/admin/forecasts` → see "Access denied".
2. Promote self to admin (manual SQL via support) → sidebar shows Admin items.
3. Create forecast → row appears, `activity_log` shows `forecast.created` with `new_value` JSON.
4. Edit multiplier → log entry has old & new values.
5. Archive → row status flips; `/forecast` no longer surfaces archived rows (existing query already filters `status='active'`).
6. Student page count matches `select count(*) from skill_recommendations where user_id=...`.

## Out of scope (later phases)

- Live labor-market API ingestion (Phase 5+)
- Bulk CSV import/export
- Role-grant UI (Phase 4)

## Tech notes

No new packages, no migrations — schema from Phase 1+2 already supports old_value/new_value JSON columns. All reads/writes via the browser supabase client governed by existing admin RLS policies.
