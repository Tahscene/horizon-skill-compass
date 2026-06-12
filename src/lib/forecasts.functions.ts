import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type GeneratedRecommendation = {
  country: string;
  skill_name: string;
  projected_multiplier: number;
  ai_rationale: string;
};

const Input = z.object({
  skillArea: z.string().trim().min(2).max(120),
  educationLevel: z.string().trim().max(60).optional().nullable(),
});

const COUNTRIES = ["Canada", "Germany", "Australia", "UAE"] as const;

const OutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        country: z.enum(COUNTRIES),
        skill_name: z.string().min(1).max(120),
        projected_multiplier: z.number().min(0.1).max(10),
        ai_rationale: z.string().min(10).max(400),
      }),
    )
    .min(1)
    .max(6),
});

function fallback(
  skillArea: string,
  forecasts: Array<{
    country: string;
    skill_name: string;
    category: string;
    projected_5yr_multiplier: number;
  }>,
): GeneratedRecommendation[] {
  const q = skillArea.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = forecasts
    .map((f) => {
      const hay = `${f.category} ${f.skill_name}`.toLowerCase();
      const hits = tokens.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
      return { f, hits };
    })
    .filter((x) => x.hits > 0 || q.length === 0)
    .sort((a, b) =>
      b.hits - a.hits ||
      Number(b.f.projected_5yr_multiplier) - Number(a.f.projected_5yr_multiplier),
    );
  const top = (scored.length ? scored : forecasts.map((f) => ({ f, hits: 0 })))
    .slice(0, 5)
    .map(({ f }) => ({
      country: f.country,
      skill_name: f.skill_name,
      projected_multiplier: Number(f.projected_5yr_multiplier),
      ai_rationale: `${f.skill_name} demand in ${f.country} is projected to grow ${Number(
        f.projected_5yr_multiplier,
      ).toFixed(1)}x over the next 5 years — strong alignment with your background in ${skillArea}.`,
    }));
  return top;
}

export const generateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: forecasts, error: fErr } = await supabase
      .from("skill_demand_forecasts")
      .select("country, skill_name, category, projected_5yr_multiplier")
      .eq("status", "active");
    if (fErr) throw new Error(fErr.message);

    const list = (forecasts ?? []) as Array<{
      country: string;
      skill_name: string;
      category: string;
      projected_5yr_multiplier: number;
    }>;

    if (list.length === 0) {
      return {
        recommendations: [] as GeneratedRecommendation[],
        source: "fallback" as const,
        forecastCount: 0,
      };
    }

    let recs: GeneratedRecommendation[] = [];
    let source: "ai" | "fallback" | "failed" = "ai";

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      recs = fallback(data.skillArea, list);
      source = "fallback";
    } else {
      try {
        const [{ generateText, Output }, { createLovableAiGatewayProvider }] = await Promise.all([
          import("ai"),
          import("@/lib/ai-gateway.server"),
        ]);
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system =
          "You are SkillHorizon AI, a labor-market analyst. Given a student's current skill area and a list of country-scoped skill demand forecasts, rank the 3-5 strongest international migration opportunities. Only use entries that appear in the supplied forecast list. Each rationale must be 1-2 sentences and must cite the multiplier and how it aligns with the student's background.";

        const userMsg = JSON.stringify({
          student: {
            current_skill_area: data.skillArea,
            education_level: data.educationLevel ?? null,
          },
          available_forecasts: list,
        });

        const { experimental_output } = await generateText({
          model,
          system,
          prompt: userMsg,
          experimental_output: Output.object({ schema: OutputSchema }),
        });

        recs = experimental_output.recommendations;
        if (recs.length === 0) {
          recs = fallback(data.skillArea, list);
          source = "fallback";
        }
      } catch (err) {
        console.error("AI generation failed:", err);
        recs = fallback(data.skillArea, list);
        source = recs.length ? "fallback" : "failed";
      }
    }

    // Persist profile fields for next visit
    await supabase
      .from("profiles")
      .update({
        current_skill_area: data.skillArea,
        education_level: data.educationLevel ?? null,
      })
      .eq("user_id", userId);

    // Activity log
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: `forecast.generated.${source}`,
      entity: "forecasts",
      entity_id: null,
    });

    return { recommendations: recs, source, forecastCount: list.length };
  });
