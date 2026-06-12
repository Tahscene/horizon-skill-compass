# SkillHorizon AI

### Global Talent Migration Predictor: AI School Workforce & Skills Alignment Platform

SkillHorizon AI helps students and education programs see where their skills will be in demand globally before they choose a career or migration path. The platform analyzes labor market demand forecasts across Canada, Germany, Australia, and the UAE, and generates personalized, ranked recommendations for each student based on their current skill area.

---

## Problem

Students and education programs lack real time visibility into which skills will be in demand in which countries. This leads to mismatched curricula, wasted training investment, and uninformed migration decisions for skilled professionals.

## Solution

SkillHorizon AI combines an admin curated global skill demand dataset with an AI recommendation engine. A student enters their current skill area and receives a ranked forecast such as:

> "Germany's demand for Cybersecurity Engineers is projected to grow 2.3x over the next 5 years."

Recommendations can be saved or dismissed and progress is tracked on a personal dashboard. Workforce and curriculum analysts maintain the underlying demand dataset and review engagement trends through an admin console.

## Target Users

- **Students**: explore personalized global skill demand forecasts, save recommendations, track progress
- **Workforce / Curriculum Analysts (Admin)**: maintain the skill demand dataset, review aggregate recommendation activity, manage platform data with full audit logging

## Core Features

- Global Talent Migration Predictor: AI-ranked skill demand forecasts across multiple countries
- Personalized recommendations with growth multipliers and rationale
- Save / dismiss recommendation tracking with progress dashboard
- Admin console for managing the demand forecast dataset
- Role based access control with secure role separation
- Full audit logging on all data mutations
- Dual theme system (Crimson / Amber) with dark and light modes
- Graceful AI fallback, deterministic recommendations if AI generation is unavailable

## Tech Stack

- React + TypeScript
- Tailwind CSS + shadcn/ui
- Lovable Cloud (Supabase-based authentication, database, row-level security)
- React Query
- Recharts
- Lucide React icons

## Architecture Highlights

- Roles stored in a dedicated `user_roles` table, checked via a `has_role()` security definer function — separated from user profiles to prevent privilege escalation
- Row-level security on every table, with owner only access by default and admin access governed by role checks
- AI recommendation generation uses a single, structured call against a curated demand dataset, with a deterministic keyword matching fallback ensuring identical UI behavior regardless of AI availability
- Activity log captures every create, edit and delete action with before/after values

## Roadmap

- Live labor market data integration via government and employer APIs
- AI driven career coaching conversations
- Curriculum gap analytics for educational institutions
- Graduate outcome tracking dashboard
- Additional country and language support

## Getting Started

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
npm run dev
```

The project uses Lovable Cloud for authentication and database. Connect a Lovable Cloud project to run the app locally with full backend functionality.

## Project Status

This project was built as a rapid production sprint MVP. Core flows: authentication, role-based access, the AI recommendation engine with fallback, and the admin console — are functional end to end with sample data.


