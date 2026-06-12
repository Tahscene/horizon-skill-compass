import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, entity: string, entityId?: string | null) {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) return;
  await supabase.from("activity_log").insert({
    user_id: uid,
    action,
    entity,
    entity_id: entityId ?? null,
  });
}
