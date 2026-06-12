import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, Flame, Globe2, ArrowRight, BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SkillHorizon AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role } = useAuth();

  const stats = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [recsRes, logRes] = await Promise.all([
        supabase
          .from("skill_recommendations")
          .select("country, skill_name, projected_multiplier")
          .eq("user_id", user!.id)
          .eq("status", "saved"),
        supabase
          .from("activity_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .like("action", "forecast.generated%"),
      ]);
      if (recsRes.error) throw recsRes.error;

      const saved = (recsRes.data ?? []).map((r) => ({
        country: r.country as string,
        skill_name: r.skill_name as string,
        projected_multiplier: Number(r.projected_multiplier),
      }));

      const generations = logRes.count ?? 0;

      const best = saved.reduce<typeof saved[number] | null>(
        (m, r) => (!m || r.projected_multiplier > m.projected_multiplier ? r : m),
        null,
      );

      const byCountry = new Map<string, { sum: number; n: number }>();
      for (const r of saved) {
        const cur = byCountry.get(r.country) ?? { sum: 0, n: 0 };
        byCountry.set(r.country, { sum: cur.sum + r.projected_multiplier, n: cur.n + 1 });
      }
      const chartData = Array.from(byCountry.entries())
        .map(([country, v]) => ({ country, avg: +(v.sum / v.n).toFixed(2), count: v.n }))
        .sort((a, b) => b.avg - a.avg);

      const top = [...byCountry.entries()].sort((a, b) => b[1].n - a[1].n)[0]?.[0] ?? null;

      return { saved, generations, best, top, chartData };
    },
  });

  const data = stats.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            {user?.email} · role: {role ?? "…"}
          </p>
        </div>
        <Link to="/forecast">
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" /> Go to Forecast <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Forecasts generated"
          value={data ? String(data.generations) : "—"}
          sub="All-time"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Highest multiplier saved"
          value={data?.best ? `${data.best.projected_multiplier.toFixed(1)}×` : "—"}
          sub={data?.best ? `${data.best.skill_name} · ${data.best.country}` : "Save a recommendation"}
          hot={!!data?.best && data.best.projected_multiplier >= 2}
        />
        <StatCard
          icon={<Globe2 className="h-5 w-5" />}
          label="Top matched country"
          value={data?.top ?? "—"}
          sub={data?.top ? "By saved recommendations" : "Save recommendations to populate"}
        />
      </div>

      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Average multiplier by country (saved)</h2>
          </div>
          {!data || data.chartData.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-center text-sm text-muted-foreground">
              Save some recommendations to populate this chart.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="country" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--primary) 10%, transparent)" }}
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="avg" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  hot,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  hot?: boolean;
}) {
  return (
    <Card className={`border-border bg-surface ${hot ? "flame-glow" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg ${
              hot
                ? "bg-[color:var(--demand-flame)]/15 text-[color:var(--demand-flame)]"
                : "bg-primary/15 text-primary"
            }`}
          >
            {icon}
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
