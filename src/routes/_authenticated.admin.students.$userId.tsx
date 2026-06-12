import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecommendationCard } from "@/components/recommendation-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/students/$userId")({
  head: () => ({ meta: [{ title: "Student — Admin" }] }),
  component: () => (
    <AdminGate>
      <StudentDetail />
    </AdminGate>
  ),
});

function StudentDetail() {
  const { userId } = Route.useParams();

  const q = useQuery({
    queryKey: ["admin", "student", userId],
    queryFn: async () => {
      const [profileRes, recsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("skill_recommendations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (recsRes.error) throw recsRes.error;
      return { profile: profileRes.data, recs: recsRes.data ?? [] };
    },
  });

  const profile = q.data?.profile as
    | {
        full_name: string | null;
        current_skill_area: string | null;
        education_level: string | null;
      }
    | null
    | undefined;
  const recs = q.data?.recs ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile?.full_name ?? "Unnamed student"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{profile?.current_skill_area ?? "No skill area"}</Badge>
            <Badge variant="secondary">{profile?.education_level ?? "No education level"}</Badge>
            <Badge variant="outline">{recs.length} recommendations</Badge>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recommendations (read-only)
        </h2>
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : recs.length === 0 ? (
          <p className="text-sm text-muted-foreground">This student has no recommendations yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => {
              const row = r as unknown as {
                id: string;
                country: string;
                skill_name: string;
                projected_multiplier: number;
                ai_rationale: string | null;
                status: string;
              };
              return (
                <div key={row.id} className="relative">
                  <RecommendationCard
                    rec={{
                      country: row.country,
                      skill_name: row.skill_name,
                      projected_multiplier: Number(row.projected_multiplier),
                      ai_rationale: row.ai_rationale,
                    }}
                    muted={row.status === "dismissed"}
                    actions={
                      <Badge variant={row.status === "saved" ? "default" : "secondary"}>
                        {row.status}
                      </Badge>
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
