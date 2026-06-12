import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiplierBadge({ value }: { value: number }) {
  const hot = value >= 2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-base font-bold tabular-nums",
        hot
          ? "border-[color:var(--demand-flame)]/40 bg-[color:var(--demand-flame)]/20 text-[color:var(--demand-flame)] flame-glow"
          : "border-primary/30 bg-primary/15 text-primary",
      )}
    >
      {hot ? <Flame className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
      {value.toFixed(1)}×
    </span>
  );
}

