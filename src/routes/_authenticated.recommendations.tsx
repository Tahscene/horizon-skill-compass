import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "My Recommendations — SkillHorizon AI" }] }),
  component: () => (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-bold">My recommendations</h1>
      <Card className="border-border bg-surface">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Saved skill-migration recommendations will appear here.
        </CardContent>
      </Card>
    </div>
  ),
});
