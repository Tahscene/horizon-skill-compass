import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brain,
  Database,
  GraduationCap,
  LineChart,
  Flame,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — SkillHorizon AI" },
      {
        name: "description",
        content:
          "What's next for SkillHorizon AI: live labor-market APIs, AI career coaching, curriculum analytics, and graduate outcome tracking.",
      },
      { property: "og:title", content: "SkillHorizon AI — Roadmap" },
      {
        property: "og:description",
        content: "The Phase 5+ scope: live signals, coaching, institutional analytics.",
      },
    ],
  }),
  component: RoadmapPage,
});

const ITEMS = [
  {
    icon: Database,
    title: "Live labor-market API integration",
    body: "Replace the curated dataset with continuous ingestion from government employment statistics, immigration bureaus, and job-posting APIs across our destination markets.",
  },
  {
    icon: Brain,
    title: "AI career coaching chat",
    body: "Conversational guidance grounded in the student's profile, saved recommendations, and live demand signals — turning a forecast into a step-by-step move.",
  },
  {
    icon: GraduationCap,
    title: "Curriculum gap analytics for institutions",
    body: "Program-lead dashboards showing where their curriculum lags the demand curve, with suggested module additions and outcome benchmarks.",
  },
  {
    icon: LineChart,
    title: "Graduate outcome tracking",
    body: "Longitudinal tracking of where alumni land, which skills carried them there, and how forecast accuracy holds up against real placements.",
  },
];

function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-panel sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight">SkillHorizon AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Phase 5+
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
            What we're building next.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            The MVP curates its demand signals by hand so every recommendation is auditable.
            These are the workstreams that turn SkillHorizon into a continuous, multi-stakeholder platform.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ITEMS.map((i) => (
            <Card key={i.title} className="rounded-xl border-border bg-surface">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <i.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{i.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{i.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkillHorizon AI · Roadmap subject to change.
        </div>
      </footer>
    </div>
  );
}
