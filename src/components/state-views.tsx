import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-border bg-surface">
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center sm:p-12">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        )}
        {action && <div className="pt-1">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/40 bg-surface">
      <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{title}</h3>
          {message && (
            <p className="mt-1 break-words text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 self-start">
            <RotateCw className="h-4 w-4" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LoadingRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-7 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
