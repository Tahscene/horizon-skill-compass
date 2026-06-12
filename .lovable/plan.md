# Phase 3a — Global Talent Migration Predictor & Student Dashboard

## 1. Routing changes

Replace the Phase 1+2 placeholder routes with the real Phase 3a pages.

```
src/routes/_authenticated.dashboard.tsx       → real summary + Recharts bar chart
src/routes/_authenticated.forecast.tsx        → NEW input + AI generation
src/routes/_authenticated.recommendations.tsx → real saved/dismissed tabs
```

Sidebar item "Forecasts" (currently `/forecasts`) is renamed to "Forecast" pointing at `/forecast`. The Phase 1+2 `/forecasts` placeholder is deleted.

## 2. Seed data (demoability)

Phase 3a needs at least some `skill_demand_forecasts` rows or the predictor is empty (the plan says admin CRUD lands in Phase 3b). Seed ~20 realistic active forecasts spanning all 4 countries and ~5 skill categories (Cybersecurity, Software Engineering, Nursing, Data Science, Renewable Energy) so the AI + fallback paths both produce visible output today. Phase 3b will let admins edit/extend them — schema stays the source of truth.

## 3. AI generation server function

`src/lib/forecasts.functions.ts` — `generateRecommendations` (`createServerFn`, POST, `requireSupabaseAuth`):

1. Validate input `{ skillArea: string, educationLevel?: string }` with Zod.
2. Load active forecasts via the authenticated supabase client (RLS-scoped, read-only `status='active'`). Project only `{ country, skill_name, category, projected_5yr_multiplier }` — compact, cost-bounded payload.
3. Call Lovable AI Gateway (`google/gemini-3-flash-preview`) via the AI SDK + `Output.object` schema:
   ```
   { recommendations: [{ country, skill_name, projected_multiplier, ai_rationale }] }
   ```
   System prompt instructs: rank 3–5 best matches for the student's skill area; rationale must be 1–2 sentences citing the multiplier and a brief alignment note; only return countries/skills present in the supplied forecast list.
4. **Fallback path** (catch on any AI failure — 429/402/parse/timeout): case-insensitive substring match `skillArea` against `category` + `skill_name`, sort by `projected_5yr_multiplier` desc, take top 3–5, build templated rationale `"{skill_name} demand in {country} is projected to grow {x}x over the next 5 years."`.
5. INSERT recommendations into `skill_recommendations` with `status='saved'` is NOT the right default — the plan splits Save/Dismiss as user actions. Instead: **return the generated batch as a transient list** (not yet persisted). The Save button on a card inserts that single recommendation; Dismiss inserts with `status='dismissed'`. This avoids polluting the table on every regen.
6. Write `activity_log` row: action `forecast.generated`, entity `skill_recommendations`, with a JSON marker in `entity_id`-adjacent fields — since `activity_log` has no metadata column, encode `ai|fallback|error` into the `action` string (`forecast.generated.ai`, `forecast.generated.fallback`, `forecast.generated.failed`).

Return shape:
```ts
{ recommendations: Recommendation[], source: 'ai' | 'fallback', forecastCount: number }
```

`LOVABLE_API_KEY` is already provisioned. Add `src/lib/ai-gateway.server.ts` with the canonical Lovable AI Gateway provider helper.

## 4. `/forecast` page

- Header + intro copy.
- **Input form** (react-hook-form + zod): `skillArea` (text, required, min 2 chars), `educationLevel` (Select: High school / Undergraduate / Graduate / Professional / Other — optional).
- On submit: also patch `profiles.current_skill_area` and `profiles.education_level` so they persist for next visit; prefill from profile on mount.
- "✨ Get My Global Talent Forecast" CTA — disabled while pending.
- **Loading state**: 4 card skeletons.
- **Result cards** grid (1/2/3 cols responsive):
  - country flag emoji (🇨🇦 🇩🇪 🇦🇺 🇦🇪) + country name badge
  - skill_name (heading)
  - prominent crimson `2.3x` multiplier badge with `TrendingUp` icon; `≥2x` adds `flame-glow` + Flame icon
  - 1–2 sentence rationale
  - "Save" (primary) and "Dismiss" (ghost) buttons → call `saveRecommendation` / `dismissRecommendation` server fns, then toast + mark card as resolved (disabled overlay).
- **Empty state** (pre-generate): icon + tagline + arrow pointing at form.
- **Error state**: alert + Retry button (never blank).
- Source badge ("AI" or "Heuristic match") in the footer of the results section — small, transparent.

## 5. `/my-recommendations` page

- Tabs: **Saved** | **Dismissed** (default Saved).
- Filter row: country Select (All / 4 countries) + text Search (matches `skill_name` or `ai_rationale`).
- List as same card design as `/forecast`, with status-appropriate actions: Saved → "Dismiss" + "Delete"; Dismissed → "Restore" + "Delete".
- Pagination: page size 12, simple Prev/Next using Supabase `.range()`.
- Empty states per tab.
- Every status change writes `activity_log` (`recommendation.saved`, `recommendation.dismissed`, `recommendation.deleted`).

## 6. `/dashboard` (real)

- Replace placeholder with:
  - Greeting + role line (kept).
  - **3 summary cards**:
    1. Forecasts generated (count of `activity_log` rows for this user where action LIKE `forecast.generated%`)
    2. Highest multiplier match (max `projected_multiplier` among saved recs + skill/country)
    3. Top matched country (mode of saved recs' `country`)
  - **Recharts bar chart**: x = country, y = avg `projected_multiplier` of saved recs (colored with `--primary`). Empty state when no saved recs.
  - "Go to Forecast" CTA.

All data fetched via TanStack Query + `useSuspenseQuery` from server fns or direct supabase queries (recommendations table is RLS-scoped to the user).

## 7. Activity logging

Extend `logActivity` helper (Phase 1+2) so it can attach an optional `entity_id`. Wire calls at:
- forecast generation (server fn, server-side insert) — `forecast.generated.<ai|fallback|failed>`, entity `forecasts`, entity_id null.
- save / dismiss / restore / delete recommendation (client, on success).

## 8. Components extracted

- `RecommendationCard` (shared between `/forecast` and `/my-recommendations`) — props: recommendation + action slots.
- `MultiplierBadge` — formats `x.x×`, adds flame styling above threshold.
- `CountryBadge` — flag emoji + label, theme-consistent.
- `Skeleton` card grid.

## 9. Validation pass

- New user → `/forecast` → enter "Cybersecurity" → result cards render (AI or fallback).
- Save one → appears in `/my-recommendations` Saved tab; Dismiss → moves to Dismissed.
- Dashboard reflects counts/chart for saved recs.
- Sign in as a second account → cannot see first account's recommendations (RLS test via Supabase query).
- Disable network / force AI error → fallback renders identical card UI + "Heuristic match" badge.
- Mobile (375px) layout: form stacks, cards stack, sidebar collapses.

## 10. Out of scope (Phase 3b)

Admin CRUD for `skill_demand_forecasts`, analytics on aggregate recommendations, role-grant UI.

## Technical detail (for reference)

- AI SDK: `ai`, `@ai-sdk/openai-compatible`, `zod` — add via `bun add`.
- Recharts: already in stack (`chart.tsx` exists).
- No new tables, no migration. Only one data insert call (seed) via `supabase--insert`.
- Server fn boundary keeps `LOVABLE_API_KEY` and prompts off the client.
