import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/forecasts")({
  head: () => ({ meta: [{ title: "Forecasts — SkillHorizon AI" }] }),
  component: () => (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">Skill demand forecasts</h1>
      <Card className="border-border bg-surface">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Forecasts will appear here once data is published.
        </CardContent>
      </Card>
    </div>
  ),
});
