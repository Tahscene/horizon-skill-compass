import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import {
  ForecastFormDialog,
  type ForecastRow,
} from "@/components/admin/forecast-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views";
import { Database } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/forecasts")({
  head: () => ({ meta: [{ title: "Forecasts — Admin" }] }),
  component: () => (
    <AdminGate>
      <AdminForecastsPage />
    </AdminGate>
  ),
});

type SortKey = "country" | "projected_5yr_multiplier" | "updated_at";

function AdminForecastsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [editing, setEditing] = useState<ForecastRow | null>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<
    { kind: "delete" | "archive" | "restore"; row: ForecastRow } | null
  >(null);

  const q = useQuery({
    queryKey: ["admin", "forecasts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_demand_forecasts")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (ForecastRow & { updated_at: string })[];
    },
  });

  const rows = q.data ?? [];

  const countries = useMemo(
    () => Array.from(new Set(rows.map((r) => r.country))).sort(),
    [rows],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const f = rows.filter((r) => {
      if (country !== "all" && r.country !== country) return false;
      if (category !== "all" && r.category !== category) return false;
      if (status !== "all" && r.status !== status) return false;
      if (s && !r.skill_name.toLowerCase().includes(s)) return false;
      return true;
    });
    f.sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
    return f;
  }, [rows, search, country, category, status, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSaved = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc);
    else {
      setSortKey(k);
      setSortAsc(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, row } = confirm;
    try {
      if (kind === "delete") {
        const { error } = await supabase
          .from("skill_demand_forecasts")
          .delete()
          .eq("id", row.id!);
        if (error) throw error;
        await logActivity("forecast.deleted", "skill_demand_forecasts", row.id, {
          old_value: row,
        });
        toast.success("Forecast deleted");
      } else {
        const newStatus = kind === "archive" ? "archived" : "active";
        const { error } = await supabase
          .from("skill_demand_forecasts")
          .update({ status: newStatus })
          .eq("id", row.id!);
        if (error) throw error;
        await logActivity(
          kind === "archive" ? "forecast.archived" : "forecast.restored",
          "skill_demand_forecasts",
          row.id,
          { old_value: { status: row.status }, new_value: { status: newStatus } },
        );
        toast.success(kind === "archive" ? "Archived" : "Restored");
      }
      setConfirm(null);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skill demand forecasts</h1>
          <p className="text-sm text-muted-foreground">
            Manage the curated dataset behind the predictor.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New forecast
        </Button>
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
                placeholder="Search skill name…"
                className="pl-8"
              />
            </div>
            <FilterSelect
              value={country}
              onChange={(v) => {
                setCountry(v);
                setPage(1);
              }}
              placeholder="Country"
              options={countries}
            />
            <FilterSelect
              value={category}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
              placeholder="Category"
              options={categories}
            />
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              placeholder="Status"
              options={["active", "archived"]}
            />
          </div>
        </CardContent>
      </Card>

      {q.isError ? (
        <ErrorState
          title="Couldn't load forecasts"
          message={(q.error as Error)?.message}
          onRetry={() => q.refetch()}
        />
      ) : !q.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title={rows.length === 0 ? "No forecasts yet" : "No forecasts match your filters"}
          description={
            rows.length === 0
              ? "Create the first row of the dataset that powers student predictions."
              : "Try clearing a filter or broadening your search."
          }
          action={
            rows.length === 0 ? (
              <Button
                className="gap-2"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> New forecast
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-2 md:hidden">
            {q.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-border bg-surface">
                    <CardContent className="p-4">
                      <LoadingRows rows={2} cols={2} />
                    </CardContent>
                  </Card>
                ))
              : pageRows.map((r) => (
                  <Card key={r.id} className="border-border bg-surface">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.skill_name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.country} · {r.category}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold tabular-nums">
                            {Number(r.projected_5yr_multiplier).toFixed(2)}×
                          </div>
                          <Badge
                            variant={r.status === "active" ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {r.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 pt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(r);
                            setOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setConfirm({
                              kind: r.status === "active" ? "archive" : "restore",
                              row: r,
                            })
                          }
                          aria-label={r.status === "active" ? "Archive" : "Restore"}
                        >
                          {r.status === "active" ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <ArchiveRestore className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirm({ kind: "delete", row: r })}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden border-border bg-surface md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      active={sortKey === "country"}
                      asc={sortAsc}
                      onClick={() => toggleSort("country")}
                    >
                      Country
                    </SortableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Demand idx</TableHead>
                    <SortableHead
                      active={sortKey === "projected_5yr_multiplier"}
                      asc={sortAsc}
                      onClick={() => toggleSort("projected_5yr_multiplier")}
                      align="right"
                    >
                      5yr ×
                    </SortableHead>
                    <TableHead>Status</TableHead>
                    <SortableHead
                      active={sortKey === "updated_at"}
                      asc={sortAsc}
                      onClick={() => toggleSort("updated_at")}
                    >
                      Updated
                    </SortableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <LoadingRows rows={6} cols={8} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.country}</TableCell>
                        <TableCell>{r.skill_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.category}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(r.current_demand_index).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {Number(r.projected_5yr_multiplier).toFixed(2)}×
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "active" ? "default" : "secondary"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditing(r);
                                setOpen(true);
                              }}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setConfirm({
                                  kind: r.status === "active" ? "archive" : "restore",
                                  row: r,
                                })
                              }
                              aria-label={r.status === "active" ? "Archive" : "Restore"}
                            >
                              {r.status === "active" ? (
                                <Archive className="h-4 w-4" />
                              ) : (
                                <ArchiveRestore className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirm({ kind: "delete", row: r })}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
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

      <ForecastFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSaved={onSaved}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete"
                ? "Delete this forecast?"
                : confirm?.kind === "archive"
                  ? "Archive this forecast?"
                  : "Restore this forecast?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete"
                ? "This permanently removes the row. The activity log will keep the prior values."
                : confirm?.kind === "archive"
                  ? "Archived forecasts stop appearing in student predictions but remain in the audit trail."
                  : "Restored forecasts re-enter the active dataset."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SortableHead({
  active,
  asc,
  onClick,
  children,
  align,
}: {
  active: boolean;
  asc: boolean;
  onClick: () => void;
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {children}
        {active && <span className="text-[10px]">{asc ? "▲" : "▼"}</span>}
      </button>
    </TableHead>
  );
}
