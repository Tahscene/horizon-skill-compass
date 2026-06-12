import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, Sparkles, BarChart3, Flame, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillHorizon AI — Know where your skills will be in demand" },
      {
        name: "description",
        content:
          "AI-driven skill-migration forecasts for Canada, Germany, Australia and the UAE. Align your learning with real labor-market demand.",
      },
      { property: "og:title", content: "SkillHorizon AI" },
      {
        property: "og:description",
        content: "Know where your skills will be in demand — before you choose your path.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Globe2,
    title: "Global Talent Migration Predictor",
    body: "AI cross-references labor-market forecasts across Canada, Germany, Australia and the UAE to surface where your skill set unlocks the strongest demand.",
    flame: true,
  },
  {
    icon: Sparkles,
    title: "Personalized Skill Forecast",
    body: "Get a tailored 5-year projection of how your current skill area will evolve — and which adjacent skills compound your migration potential.",
    flame: false,
  },
  {
    icon: BarChart3,
    title: "Curriculum Demand Analytics",
    body: "For program leads: see which competencies your students should be ready to ship before the market asks for them.",
    flame: false,
  },
];

const countries = ["Canada", "Germany", "Australia", "UAE"];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">SkillHorizon AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent), radial-gradient(40% 40% at 80% 20%, color-mix(in oklab, var(--demand-flame) 25%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-[color:var(--demand-flame)]" />
              Forecasting demand across 4 destination markets
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Know where your skills will be in demand —
              <span className="block text-primary">before you choose your path.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Students and education programs lack real-time visibility into which skills will be in
              demand in which countries — leading to mismatched curricula and uninformed migration
              decisions. SkillHorizon AI fixes that.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Explore forecasts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Country strip */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Tracking demand in
          </span>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {countries.map((c) => (
              <span key={c} className="text-sm font-semibold">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Decisions, backed by demand signals.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three lenses on the same question: where is the world hiring your skill, and what
            should you learn next?
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className={`rounded-xl border-border bg-surface transition hover:-translate-y-0.5 ${
                f.flame ? "flame-glow" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                {f.flame && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--demand-flame)]/15 px-2.5 py-1 text-xs font-semibold text-[color:var(--demand-flame)]">
                    <Flame className="h-3 w-3" /> High-growth skill
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 md:flex-row">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SkillHorizon AI
          </span>
          <span className="text-xs text-muted-foreground">
            Built for students, curriculum leads & workforce analysts.
          </span>
        </div>
      </footer>
    </div>
  );
}
