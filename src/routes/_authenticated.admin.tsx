import { createFileRoute } from "@tanstack/react-router";
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
import { BarChart3, Database, Flame, Sparkles, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AdminGate } from "@/components/admin/admin-gate";
import { KpiCard } from "@/components/admin/kpi-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SkillHorizon AI" }] }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  return (
    <AdminGate>
      <AdminOverview />
    </AdminGate>
  );
}

function AdminOverview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [forecastsRes, studentRolesRes, recsRes] = await Promise.all([
        supabase
          .from("skill_demand_forecasts")
          .select("country, projected_5yr_multiplier, status"),
        supabase.from("user_roles").select("user_id", { count: "exact" }).eq("role", "standard_user"),
        supabase.from("skill_recommendations").select("id", { count: "exact", head: true }),
      ]);
      if (forecastsRes.error) throw forecastsRes.error;
      const forecasts = forecastsRes.data ?? [];
      const active = forecasts.filter((f) => f.status === "active");
      const avgMult =
        active.length === 0
          ? 0
          : active.reduce((s, r) => s + Number(r.projected_5yr_multiplier), 0) / active.length;

      const byCountry = new Map<string, { sum: number; n: number }>();
      for (const r of active) {
        const c = byCountry.get(r.country) ?? { sum: 0, n: 0 };
        byCountry.set(r.country, {
          sum: c.sum + Number(r.projected_5yr_multiplier),
          n: c.n + 1,
        });
      }
      const chartData = Array.from(byCountry.entries())
        .map(([country, v]) => ({ country, avg: +(v.sum / v.n).toFixed(2) }))
        .sort((a, b) => b.avg - a.avg);

      return {
        activeCount: active.length,
        studentCount: studentRolesRes.count ?? 0,
        recsCount: recsRes.count ?? 0,
        avgMult,
        chartData,
      };
    },
  });

  const d = q.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Curate the intelligence layer behind the predictor.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Database className="h-5 w-5" />}
          label="Active forecasts"
          value={d ? String(d.activeCount) : "—"}
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Students"
          value={d ? String(d.studentCount) : "—"}
        />
        <KpiCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Recommendations"
          value={d ? String(d.recsCount) : "—"}
        />
        <KpiCard
          icon={<Flame className="h-5 w-5" />}
          label="Avg 5yr multiplier"
          value={d ? `${d.avgMult.toFixed(2)}×` : "—"}
          hot={!!d && d.avgMult >= 2}
        />
      </div>

      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">
              Average projected multiplier by country (active)
            </h2>
          </div>
          {!d || d.chartData.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
              No active forecasts yet.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
