import { Card, CardContent } from "@/components/ui/card";
import { CountryBadge } from "./country-badge";
import { MultiplierBadge } from "./multiplier-badge";
import type { ReactNode } from "react";

export interface RecommendationView {
  country: string;
  skill_name: string;
  projected_multiplier: number;
  ai_rationale: string | null;
}

export function RecommendationCard({
  rec,
  actions,
  muted,
}: {
  rec: RecommendationView;
  actions?: ReactNode;
  muted?: boolean;
}) {
  return (
    <Card
      className={`rounded-xl border-border bg-surface transition ${
        muted ? "opacity-60" : "hover:-translate-y-0.5"
      }`}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <CountryBadge country={rec.country} />
          <MultiplierBadge value={Number(rec.projected_multiplier)} />
        </div>
        <h3 className="text-lg font-semibold leading-snug">{rec.skill_name}</h3>
        <p className="flex-1 text-sm text-muted-foreground">
          {rec.ai_rationale ?? "—"}
        </p>
        {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
      </CardContent>
    </Card>
  );
}
