import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, Users } from "lucide-react";

import { AdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/state-views";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({ meta: [{ title: "Students — Admin" }] }),
  component: () => (
    <AdminGate>
      <StudentsPage />
    </AdminGate>
  ),
});

type StudentRow = {
  user_id: string;
  full_name: string | null;
  current_skill_area: string | null;
  education_level: string | null;
  saved: number;
  total: number;
};

function StudentsPage() {
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "students"],
    queryFn: async (): Promise<StudentRow[]> => {
      const [rolesRes, recsRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("user_id, profiles:profiles!inner(user_id, full_name, current_skill_area, education_level)")
          .eq("role", "standard_user"),
        supabase.from("skill_recommendations").select("user_id, status"),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      if (recsRes.error) throw recsRes.error;

      const counts = new Map<string, { saved: number; total: number }>();
      for (const r of recsRes.data ?? []) {
        const uid = (r as { user_id: string }).user_id;
        const c = counts.get(uid) ?? { saved: 0, total: 0 };
        c.total += 1;
        if ((r as { status: string }).status === "saved") c.saved += 1;
        counts.set(uid, c);
      }

      return (rolesRes.data ?? []).map((row) => {
        const p = (row as unknown as {
          user_id: string;
          profiles: {
            full_name: string | null;
            current_skill_area: string | null;
            education_level: string | null;
          };
        });
        const c = counts.get(p.user_id) ?? { saved: 0, total: 0 };
        return {
          user_id: p.user_id,
          full_name: p.profiles?.full_name ?? null,
          current_skill_area: p.profiles?.current_skill_area ?? null,
          education_level: p.profiles?.education_level ?? null,
          saved: c.saved,
          total: c.total,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((r) =>
      (r.full_name ?? "").toLowerCase().includes(s) ||
      (r.current_skill_area ?? "").toLowerCase().includes(s),
    );
  }, [q.data, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">Read-only view of student profiles and engagement.</p>
      </header>

      <Card className="border-border bg-surface">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or skill area…"
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {q.isError ? (
        <ErrorState
          title="Couldn't load students"
          message={(q.error as Error)?.message}
          onRetry={() => q.refetch()}
        />
      ) : !q.isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No students yet"
          description="Student profiles will show up here once they sign up."
        />
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {q.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-border bg-surface">
                    <CardContent className="p-4">
                      <LoadingRows rows={2} cols={2} />
                    </CardContent>
                  </Card>
                ))
              : filtered.map((r) => (
                  <Link
                    key={r.user_id}
                    to="/admin/students/$userId"
                    params={{ userId: r.user_id }}
                  >
                    <Card className="border-border bg-surface transition hover:bg-muted/30">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.full_name ?? "Unnamed"}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.current_skill_area ?? "—"} · {r.education_level ?? "—"}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-muted-foreground">Saved</div>
                          <div className="font-semibold tabular-nums">{r.saved}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>

          {/* Desktop table */}
          <Card className="hidden border-border bg-surface md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Skill area</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead className="text-right">Saved</TableHead>
                    <TableHead className="text-right">Total recs</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <LoadingRows rows={5} cols={6} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.user_id} className="cursor-pointer hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <Link
                            to="/admin/students/$userId"
                            params={{ userId: r.user_id }}
                            className="hover:underline"
                          >
                            {r.full_name ?? "Unnamed"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.current_skill_area ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.education_level ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.saved}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            to="/admin/students/$userId"
                            params={{ userId: r.user_id }}
                            className="inline-flex items-center text-sm text-primary"
                          >
                            View <ChevronRight className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
