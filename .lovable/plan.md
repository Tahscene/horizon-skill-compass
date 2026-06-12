# Phase 1+2 — Foundation, Identity, Landing & Data Model

## Vision & Problem

**Product:** SkillHorizon AI — predicts where students' skills will be in demand globally (Canada, Germany, Australia, UAE), so they can align their learning and migration choices with real labor-market forecasts.

**Problem:** Students and education programs lack real-time visibility into which skills will be in demand in which countries, leading to mismatched curricula and uninformed migration decisions.

**Target users:**
- **Standard user (student):** explores forecasts, saves personalized skill recommendations.
- **Admin (workforce/curriculum analyst):** maintains forecast dataset, reviews aggregate recommendation trends and activity.

**Phase 1+2 outcome:** Public landing page live, email/password auth working, role-aware app shell, and a schema that supports Phases 3–5 without future migrations.

## 1. Lovable Cloud + Auth

- Enable Lovable Cloud (database + auth).
- Email/password auth (no email confirmation for dev speed; configurable later).
- Auth page at `/auth` with sign-in / sign-up tabs.
- Signup flow: create `auth.users` row → trigger inserts `profiles` row with `role='standard_user'`, nullable `current_skill_area` and `education_level`.
- Session: `onAuthStateChange` listener wired once in `__root.tsx`; cache invalidation + redirect on sign-out per integration rules.

## 2. Data Model (Supabase migration)

**Enums**
- `app_role`: `admin`, `standard_user`
- `country_code`: `Canada`, `Germany`, `Australia`, `UAE`
- `forecast_status`: `active`, `archived`
- `recommendation_status`: `saved`, `dismissed`

**Tables (all with `created_at`, `updated_at` + trigger)**
- `profiles` — `id` (PK), `user_id` (FK auth.users, unique), `full_name`, `role app_role default 'standard_user'`, `current_skill_area text null`, `education_level text null`
- `user_roles` — `id`, `user_id`, `role app_role`, unique(user_id, role). Roles stored separately from profiles (security).
- `skill_demand_forecasts` — `id`, `country country_code`, `skill_name`, `category`, `current_demand_index numeric`, `projected_5yr_multiplier numeric`, `source_note text`, `status forecast_status default 'active'`
- `skill_recommendations` — `id`, `user_id`, `country text`, `skill_name`, `projected_multiplier numeric`, `ai_rationale text`, `status recommendation_status default 'saved'`
- `activity_log` — `id`, `user_id`, `action text`, `entity text`, `entity_id uuid`, `timestamp timestamptz default now()`

**Security definer fn:** `public.has_role(_user_id uuid, _role app_role) returns boolean`.

**Auto-profile trigger:** `on auth.users insert` → insert into `profiles` + `user_roles` with `standard_user`.

## 3. RLS Policies & Grants

Public-schema GRANTs to `authenticated` + `service_role` for every table. No `anon` grants.

- `profiles`: user reads/updates own; admins read all (via `has_role`).
- `user_roles`: user reads own; only service_role mutates (admin grants happen out-of-band in Phase 3+).
- `skill_demand_forecasts`: authenticated read where `status='active'`; admin full CRUD.
- `skill_recommendations`: owner full CRUD (`user_id = auth.uid()`); admin SELECT only.
- `activity_log`: authenticated INSERT for own actions; admin SELECT all; no UPDATE/DELETE.

Safe fallback: if any policy misconfigured, default to owner-only.

## 4. Design System (Crimson/Amber RED)

In `src/styles.css` add tokens for both themes (crimson default, amber alt) and both modes (dark default, light), all in oklch. Add `data-theme` + `data-mode` attribute selectors on `<html>`. Inter font loaded via `<link>` in `__root.tsx` head.

Semantic tokens: `--background`, `--surface`, `--border`, `--foreground`, `--primary`, `--primary-dark`, `--accent`, `--demand-flame` (for ≥2x multiplier badges).

Components use semantic classes only — never hardcoded colors.

## 5. Routes

```
src/routes/
  __root.tsx               (providers, theme attrs, auth listener)
  index.tsx                (landing — public)
  auth.tsx                 (sign in / sign up — public)
  _authenticated/
    route.tsx              (integration-managed gate)
    dashboard.tsx          (placeholder)
    admin.tsx              (admin-gated placeholder)
```

Each public route gets its own `head()` with route-specific title/description/OG tags.

**Admin gating:** in `_authenticated/admin.tsx` `beforeLoad`, fetch profile role via a server fn and `redirect` to `/dashboard` if not admin.

## 6. Landing Page (`/`)

- **Navbar:** logo "SkillHorizon AI", theme switcher (crimson/amber + dark/light), Sign In CTA.
- **Hero:** "Know where your skills will be in demand — before you choose your path." Subheading + primary CTA (Get Started) + secondary (Explore Forecasts).
- **Problem statement section:** the mismatch narrative.
- **3 feature cards** with lucide icons:
  1. Global Talent Migration Predictor (Globe/TrendingUp)
  2. Personalized Skill Forecast (Sparkles)
  3. Curriculum Demand Analytics (BarChart3)
- **Country strip:** Canada · Germany · Australia · UAE with flags/labels.
- **Footer.**

Glassmorphism navbar, rounded-xl cards, subtle crimson glow on hovers, flame icon swatch in cards mentioning growth multipliers.

## 7. App Shell (authenticated)

- Sidebar (shadcn) with: Dashboard, Forecasts (placeholder), My Recommendations (placeholder), Admin Panel (only if `has_role(admin)`).
- Top bar: theme switcher, profile menu (Sign out).
- `/dashboard` empty-state card.

## 8. Activity Logging

Helper `logActivity(action, entity, entity_id)` server fn used by future create/edit/delete flows. Phase 1+2 just wires the table and helper; no production calls yet beyond `auth.signup` → `profile.created`.

## Validation

- Signup creates `profiles` + `user_roles` with `standard_user`.
- Non-admin hitting `/admin` redirected to `/dashboard`.
- User A cannot SELECT user B's `skill_recommendations` (verified via SQL).
- All tables populate `created_at` / `updated_at`.
- Landing page renders unauthenticated; theme switcher swaps crimson↔amber and dark↔light.

## Out of Scope (Phase 3+)

AI rationale generation, real forecast data seeding, admin CRUD UI, recommendation creation UI, analytics charts.
