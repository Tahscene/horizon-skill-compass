import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export function AdminGate({ children }: { children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading || role === null) {
    return <div className="text-sm text-muted-foreground">Checking access…</div>;
  }
  if (role !== "admin") {
    return (
      <Card className="mx-auto max-w-md border-border bg-surface">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-semibold">Access denied</h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to view this page.
          </p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
