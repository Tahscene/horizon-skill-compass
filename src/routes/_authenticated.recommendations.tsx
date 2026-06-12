import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Trash2, Undo2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RecommendationCard,
  type RecommendationView,
} from "@/components/recommendation-card";
import { RecommendationSkeletonGrid } from "@/components/card-skeleton";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/recommendations")({
  head: () => ({ meta: [{ title: "My Recommendations — SkillHorizon AI" }] }),
  component: RecsPage,
});

const PAGE_SIZE = 12;
const COUNTRIES = ["All", "Canada", "Germany", "Australia", "UAE"];

type Row = RecommendationView & { id: string; status: "saved" | "dismissed" };

function RecsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"saved" | "dismissed">("saved");
  const [country, setCountry] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const key = ["recs", user?.id, tab, country, search, page];
  const query = useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: async () => {
      let q = supabase
        .from("skill_recommendations")
        .select("id, country, skill_name, projected_multiplier, ai_rationale, status", {
          count: "exact",
        })
        .eq("user_id", user!.id)
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (country !== "All") q = q.eq("country", country);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`skill_name.ilike.${s},ai_rationale.ilike.${s}`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Row[], total: count ?? 0 };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "saved" | "dismissed" }) => {
      const { error } = await supabase
        .from("skill_recommendations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      await logActivity(`recommendation.${status === "saved" ? "restored" : "dismissed"}`, "skill_recommendations", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skill_recommendations").delete().eq("id", id);
      if (error) throw error;
      await logActivity("recommendation.deleted", "skill_recommendations", id);
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["recs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = query.data?.total ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Saved markets and skills you've shortlisted from your forecasts.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setPage(0); }}>
          <TabsList>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={country} onValueChange={(v) => { setCountry(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-[200px]"
          />
        </div>
      </div>

      {query.isLoading ? (
        <RecommendationSkeletonGrid />
      ) : (query.data?.rows.length ?? 0) === 0 ? (
        <Card className="border-dashed border-border bg-surface">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Bookmark className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">
              Nothing {tab === "saved" ? "saved" : "dismissed"} yet
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Generate a forecast and save the markets you want to explore further.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {query.data!.rows.map((r) => (
              <RecommendationCard
                key={r.id}
                rec={r}
                actions={
                  <>
                    {tab === "saved" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "dismissed" })}
                      >
                        Dismiss
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "saved" })}
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Restore
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => del.mutate(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </>
                }
              />
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {maxPage + 1} · {total} total
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
