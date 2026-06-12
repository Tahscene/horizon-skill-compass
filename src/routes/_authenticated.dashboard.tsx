import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SkillHorizon AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role } = useAuth();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          {user?.email} · role: {role ?? "…"}
        </p>
      </div>
      <Card className="border-border bg-surface">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Your skill horizon is being charted.</h2>
            <p className="text-sm text-muted-foreground">
              Personalized forecasts and recommendations will appear here as the platform grows.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
