import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  icon,
  label,
  value,
  sub,
  hot,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
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
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
