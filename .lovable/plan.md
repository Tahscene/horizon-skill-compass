# Phase 4 — Resilience, Edge Cases & Polish

## 1. Shared state primitives

Add `src/components/state-views.tsx` exporting:
- `EmptyState({ icon, title, description, action? })`
- `ErrorState({ title?, message, onRetry })`
- `LoadingRows({ rows, cols })` for table skeletons

Reuse across pages so visuals are consistent.

## 2. Per-page wiring

**`/forecast`** (Phase 3a)
- Polish existing AI error: when `mutation.isError`, render new `ErrorState` (currently inline) with explicit "AI generation failed — showing nothing yet" copy + `Retry` calling `mutation.mutate(lastInput)`.
- Pre-generation empty: replace current placeholder with `EmptyState` (Sparkles icon, "Pick a skill area to begin", CTA scrolls to form).
- Grid: confirm `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (already mostly there — audit + tighten).

**`/recommendations`**
- Add `ErrorState` when the list query errors (currently silent).
- Empty Saved tab: bookmark icon + "No saved recommendations yet" + CTA `Link to /forecast`.
- Empty Dismissed tab: archive icon + neutral copy.

**`/dashboard`**
- Add `ErrorState` for stats query error.
- Loading skeletons for KPI cards (replace `"—"` placeholder with subtle pulse).
- Already has chart empty state — keep.

**`/admin` overview**
- Add `ErrorState` + `LoadingRows`-style skeleton KPIs.

**`/admin/forecasts`**
- Replace "Loading…" / "No forecasts match" rows with `LoadingRows` and `EmptyState` (Database icon, "No forecasts yet — create one to feed the predictor", CTA opens dialog).
- Add error row when query fails.

**`/admin/students`** and **`/admin/logs`**
- Same treatment (loading skeleton rows + EmptyState + ErrorState).

## 3. Mobile

**`/forecast`** — single-column cards <768px (already `md:grid-cols-2`; verify gap + form stacks).

**`/dashboard`** — KPI cards already `md:grid-cols-3`; ensure header wraps via `grid-cols-[minmax(0,1fr)_auto]` pattern.

**`/admin` tables** — Wrap each table page in a responsive switcher:
- ≥`md`: existing `<Table>`.
- `<md`: render mapped list of compact cards (using `EmptyState` when zero). Implementation: `hidden md:block` for the table card; `md:hidden space-y-2` list of `<Card>` summaries showing the 2–3 most important columns + actions.

Apply to: `/admin/forecasts`, `/admin/students`, `/admin/logs`.

## 4. Theme audit

No code-level token changes expected. Verify by:
- Toggling theme switcher (crimson/amber × dark/light) on `/forecast`, `/dashboard`, `/admin` and screenshotting.
- Inspect `MultiplierBadge` contrast — if the amber+light combo is weak, tighten its token in `src/components/multiplier-badge.tsx` (use `text-primary-foreground` on filled background instead of theme-foreground).
- Adjust `flame-glow` halo only if necessary; otherwise leave.

## 5. Roadmap

Add `src/routes/roadmap.tsx` (public route) listing Phase 5+ items as content cards:
- Live labor-market API integration (government employment data, job-posting APIs)
- AI career coaching chat
- Curriculum gap analytics for institutions
- Graduate outcome tracking dashboard

Add a `Roadmap` link to the landing page footer (`src/routes/index.tsx`).

## 6. Validation

Click through:
- /forecast: submit invalid → form error; submit valid offline → fallback OR error retry path.
- /recommendations: empty saved tab → CTA jumps to /forecast.
- /admin/forecasts: archive last forecast → empty state renders; click "New" from empty state opens dialog.
- Resize to 360px width → tables become card lists, no horizontal scroll.
- Cycle theme switcher on all 3 areas; confirm multiplier badge legibility in each combo.

## Out of scope

- New tables / migrations
- New AI prompts
- Animations beyond existing `flame-glow`

## Files touched

- New: `src/components/state-views.tsx`, `src/routes/roadmap.tsx`
- Edited: `_authenticated.forecast.tsx`, `_authenticated.recommendations.tsx`, `_authenticated.dashboard.tsx`, `_authenticated.admin.tsx`, `_authenticated.admin.forecasts.tsx`, `_authenticated.admin.students.tsx`, `_authenticated.admin.logs.tsx`, `multiplier-badge.tsx` (only if contrast needs nudge), `index.tsx` (footer link)

No package installs. No schema changes.
