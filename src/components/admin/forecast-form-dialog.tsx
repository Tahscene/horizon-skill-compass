import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity";

export type ForecastRow = {
  id?: string;
  country: string;
  skill_name: string;
  category: string;
  current_demand_index: number;
  projected_5yr_multiplier: number;
  source_note: string | null;
  status: string;
};

const schema = z.object({
  country: z.string().trim().min(2).max(60),
  skill_name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  current_demand_index: z.number().min(0).max(100),
  projected_5yr_multiplier: z.number().min(0.1).max(10),
  source_note: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["active", "archived"]),
});

type FormValues = z.infer<typeof schema>;

export function ForecastFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ForecastRow | null;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      country: "",
      skill_name: "",
      category: "",
      current_demand_index: 50,
      projected_5yr_multiplier: 1.5,
      source_note: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        country: initial?.country ?? "",
        skill_name: initial?.skill_name ?? "",
        category: initial?.category ?? "",
        current_demand_index: Number(initial?.current_demand_index ?? 50),
        projected_5yr_multiplier: Number(initial?.projected_5yr_multiplier ?? 1.5),
        source_note: initial?.source_note ?? "",
        status: (initial?.status as "active" | "archived") ?? "active",
      });
    }
  }, [open, initial, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, source_note: values.source_note || null };
    try {
      if (isEdit && initial?.id) {
        const { error } = await supabase
          .from("skill_demand_forecasts")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(payload as any)
          .eq("id", initial.id);
        if (error) throw error;
        await logActivity("forecast.updated", "skill_demand_forecasts", initial.id, {
          old_value: initial,
          new_value: payload,
        });
        toast.success("Forecast updated");
      } else {
        const { data, error } = await supabase
          .from("skill_demand_forecasts")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(payload as any)
          .select()
          .single();
        if (error) throw error;
        await logActivity("forecast.created", "skill_demand_forecasts", data?.id, {
          new_value: payload,
        });
        toast.success("Forecast created");
      }
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit forecast" : "New forecast"}</DialogTitle>
          <DialogDescription>
            Curate the labor-market signal that powers student recommendations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Country" error={form.formState.errors.country?.message}>
              <Input {...form.register("country")} placeholder="Germany" />
            </Field>
            <Field label="Category" error={form.formState.errors.category?.message}>
              <Input {...form.register("category")} placeholder="Cybersecurity" />
            </Field>
          </div>
          <Field label="Skill name" error={form.formState.errors.skill_name?.message}>
            <Input
              {...form.register("skill_name")}
              placeholder="Cloud Security Engineer"
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field
              label="Current demand index (0–100)"
              error={form.formState.errors.current_demand_index?.message}
            >
              <Input
                type="number"
                step="1"
                {...form.register("current_demand_index", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Projected 5yr multiplier"
              error={form.formState.errors.projected_5yr_multiplier?.message}
            >
              <Input
                type="number"
                step="0.1"
                {...form.register("projected_5yr_multiplier", { valueAsNumber: true })}
              />
            </Field>
          </div>
          <Field label="Source note (optional)">
            <Textarea
              rows={3}
              {...form.register("source_note")}
              placeholder="WEF Future of Jobs 2026 · EU Labour Bureau Q2"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.watch("status")}
              onValueChange={(v) =>
                form.setValue("status", v as "active" | "archived", { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save changes" : "Create forecast"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
