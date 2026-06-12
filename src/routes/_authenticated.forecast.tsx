import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Compass, AlertTriangle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { generateRecommendations } from "@/lib/forecasts.functions";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/forecast")({
  head: () => ({ meta: [{ title: "Forecast — SkillHorizon AI" }] }),
  component: ForecastPage,
});

const FormSchema = z.object({
  skillArea: z.string().trim().min(2, "Please enter your skill area").max(120),
  educationLevel: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

const EDUCATION_OPTIONS = [
  "High school",
  "Undergraduate",
  "Graduate",
  "Professional",
  "Other",
];

function ForecastPage() {
  const { user } = useAuth();
  const generate = useServerFn(generateRecommendations);

  const [results, setResults] = useState<RecommendationView[] | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | "failed" | null>(null);
  const [resolved, setResolved] = useState<Record<number, "saved" | "dismissed">>({});

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("current_skill_area, education_level")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { skillArea: "", educationLevel: undefined },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset({
        skillArea: profile.data.current_skill_area ?? "",
        educationLevel: profile.data.education_level ?? undefined,
      });
    }
  }, [profile.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (v: FormValues) =>
      generate({
        data: { skillArea: v.skillArea, educationLevel: v.educationLevel ?? null },
      }),
    onSuccess: (data) => {
      setResults(data.recommendations);
      setSource(data.source);
      setResolved({});
      if (data.recommendations.length === 0) {
        toast.warning("No forecasts matched yet — try a broader skill area.");
      }
    },
    onError: (err: Error) => toast.error(err.message ?? "Generation failed"),
  });

  const onSave = async (rec: RecommendationView, idx: number) => {
    const { error } = await supabase.from("skill_recommendations").insert({
      user_id: user!.id,
      country: rec.country,
      skill_name: rec.skill_name,
      projected_multiplier: rec.projected_multiplier,
      ai_rationale: rec.ai_rationale,
      status: "saved",
    });
    if (error) return toast.error(error.message);
    setResolved((r) => ({ ...r, [idx]: "saved" }));
    await logActivity("recommendation.saved", "skill_recommendations");
    toast.success("Saved to your recommendations");
  };

  const onDismiss = async (rec: RecommendationView, idx: number) => {
    const { error } = await supabase.from("skill_recommendations").insert({
      user_id: user!.id,
      country: rec.country,
      skill_name: rec.skill_name,
      projected_multiplier: rec.projected_multiplier,
      ai_rationale: rec.ai_rationale,
      status: "dismissed",
    });
    if (error) return toast.error(error.message);
    setResolved((r) => ({ ...r, [idx]: "dismissed" }));
    await logActivity("recommendation.dismissed", "skill_recommendations");
  };

  const submit = (v: FormValues) => mutation.mutate(v);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Global Talent Migration Predictor
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your skill horizon, charted.</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Tell us what you do. We'll match it against live labor-market demand across Canada,
          Germany, Australia and the UAE — and rank where you should be looking next.
        </p>
      </header>

      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <form
            onSubmit={form.handleSubmit(submit)}
            className="grid gap-4 md:grid-cols-[1fr,220px,auto] md:items-end"
          >
            <div className="space-y-1.5">
              <Label htmlFor="skillArea">Current skill area</Label>
              <Input
                id="skillArea"
                placeholder="e.g. Cybersecurity, Nursing, Software Engineering"
                {...form.register("skillArea")}
              />
              {form.formState.errors.skillArea && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.skillArea.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Education level</Label>
              <Select
                value={form.watch("educationLevel") ?? ""}
                onValueChange={(v) => form.setValue("educationLevel", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" disabled={mutation.isPending} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? "Analyzing…" : "Get My Global Talent Forecast"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        {mutation.isPending && <RecommendationSkeletonGrid />}

        {!mutation.isPending && mutation.isError && (
          <Card className="border-destructive/40 bg-surface">
            <CardContent className="flex items-start gap-3 p-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold">Couldn't generate your forecast</h3>
                <p className="text-sm text-muted-foreground">
                  {(mutation.error as Error)?.message ?? "Unknown error"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutation.mutate(form.getValues())}
                className="gap-2"
              >
                <RotateCw className="h-4 w-4" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!mutation.isPending && results === null && !mutation.isError && (
          <Card className="border-dashed border-border bg-surface">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Your forecast will appear here</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Enter your current skill area above and hit{" "}
                <span className="font-medium text-foreground">
                  Get My Global Talent Forecast
                </span>{" "}
                to see the top markets hiring people like you.
              </p>
            </CardContent>
          </Card>
        )}

        {!mutation.isPending && results && results.length === 0 && (
          <Card className="border-border bg-surface">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No matches yet — try a broader skill area like "Engineering" or "Health".
            </CardContent>
          </Card>
        )}

        {!mutation.isPending && results && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Top {results.length} markets for you
              </h2>
              <span className="text-xs text-muted-foreground">
                {source === "ai" ? "AI-ranked" : source === "fallback" ? "Heuristic match" : "—"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((r, i) => {
                const state = resolved[i];
                return (
                  <RecommendationCard
                    key={i}
                    rec={r}
                    muted={!!state}
                    actions={
                      state ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {state === "saved" ? "✓ Saved" : "Dismissed"}
                        </span>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => onSave(r, i)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onDismiss(r, i)}>
                            Dismiss
                          </Button>
                        </>
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
