import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SkillHorizon AI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && role && role !== "admin") navigate({ to: "/dashboard" });
  }, [role, loading, navigate]);

  if (role !== "admin") {
    return <div className="text-sm text-muted-foreground">Checking access…</div>;
  }
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">Admin panel</h1>
      <Card className="border-border bg-surface">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Forecast management & analytics will live here.
        </CardContent>
      </Card>
    </div>
  );
}
