import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ScrollText } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Activity log — Admin" }] }),
  component: () => (
    <AdminGate>
      <LogsPage />
    </AdminGate>
  ),
});

type LogRow = {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  timestamp: string;
  old_value: unknown;
  new_value: unknown;
  profiles?: { full_name: string | null } | null;
};

function LogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const q = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: async (): Promise<LogRow[]> => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, profiles:profiles!activity_log_user_id_fkey(full_name)")
        .order("timestamp", { ascending: false })
        .limit(500);
      if (error) {
        // fall back without join if FK alias mismatch
        const fb = await supabase
          .from("activity_log")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(500);
        if (fb.error) throw fb.error;
        return (fb.data ?? []) as unknown as LogRow[];
      }
      return (data ?? []) as unknown as LogRow[];
    },
  });

  const rows = q.data ?? [];
  const actions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.action))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (s && !r.entity.toLowerCase().includes(s) && !(r.entity_id ?? "").includes(s)) return false;
      return true;
    });
  }, [rows, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail of forecast and recommendation changes.
        </p>
      </header>

      <Card className="border-border bg-surface">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search entity or id…"
                className="pl-8"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {q.isError ? (
        <ErrorState
          title="Couldn't load activity log"
          message={(q.error as Error)?.message}
          onRetry={() => q.refetch()}
        />
      ) : !q.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title="No log entries yet"
          description="Forecast and recommendation changes will appear here as they happen."
        />
      ) : (
        <Card className="border-border bg-surface">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <LoadingRows rows={6} cols={5} />
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.entity}</div>
                        <div className="text-muted-foreground truncate max-w-[180px]">
                          {r.entity_id ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.profiles?.full_name ?? r.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {r.old_value || r.new_value ? (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                View diff
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                              <JsonBlock label="Before" value={r.old_value} />
                              <JsonBlock label="After" value={r.new_value} />
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{label}</div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] leading-snug">
        {value ? JSON.stringify(value, null, 2) : "null"}
      </pre>
    </div>
  );
}
