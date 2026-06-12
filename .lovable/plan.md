## Phase 5 — Launch Readiness & Demo Validation

### Current state
- Forecasts table: 20 seeded entries already exist incl. Germany / Cybersecurity Engineer @ 2.3x ✓
- Only 1 user exists (`tahsin shuborna`, standard_user) — no admin, no demo student profile populated, no recommendations
- All routes from Phase 1–4 present; no `/admin` for non-admins (gated by `AdminGate`)

### Plan

**1. Seed admin role + demo student profile (migration)**
- Promote existing user `tahsin shuborna` to `admin` via `user_roles` insert (idempotent `ON CONFLICT DO NOTHING`)
- Update that profile: `current_skill_area='Cybersecurity'`, `education_level='Bachelor's Degree'` (so the AI predictor has context to match the Germany 2.3x entry)
- Seed 4 `skill_recommendations` for this user matching real forecast rows:
  - Germany / Cybersecurity Engineer / 2.3x — `status='saved'` (flagship)
  - UAE / Cybersecurity Architect / 2.6x — `status='saved'`
  - Canada / Cybersecurity Analyst / 1.9x — `status='dismissed'`
  - Australia / Cybersecurity Specialist / 2.1x — `status='saved'`
- Note: only one user exists, so they serve as both admin and seeded student. Acceptable for hackathon demo; documented in roadmap.

**2. Demo Mode banner**
- New `src/components/demo-mode-banner.tsx`: thin amber strip "Hackathon prototype — sample forecast data shown", dismissible (sessionStorage), Sparkles icon
- Mount once inside `RootComponent` in `src/routes/__root.tsx` above `<Outlet />` so it shows on every route incl. landing/auth

**3. Route audit**
- Verify each `<Link to=...>` and nav entry resolves to an existing route file (sidebar, landing footer, roadmap, admin sub-nav, recommendation cards)
- Confirm `_authenticated/admin/*` paths render and `/admin` gate redirects standard users
- Fix any stale anchors found

**4. Publish + production validation**
- Tighten `__root.tsx` head meta: add `og:image` candidate omission note, ensure `twitter:title`/`twitter:description` present (currently only `summary` card type set)
- Run security scan → publish to Lovable
- Post-publish manual checks (described to user, not automated):
  - Sign in as seeded user → `/forecast` → generate → confirm Germany/Cybersecurity 2.3x surfaces in top results
  - `/admin` accessible
  - Sign out / sign up as new user → confirm `/admin` blocked
  - All sidebar links resolve

### Files
- New migration: promote admin, update profile, insert 4 recommendations
- New: `src/components/demo-mode-banner.tsx`
- Edit: `src/routes/__root.tsx` (mount banner + augment social meta)
- Possibly edit: any broken `<Link>` discovered during audit (no anticipated changes)

### Out of scope
No new features, no schema changes, no AI prompt changes.