import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Playdate = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  to_dog_id: string;
  park_name: string | null;
  park_lat: number | null;
  park_lng: number | null;
  proposed_at: string | null;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  to_dog_name?: string;
  from_display_name?: string;
};

export const createPlaydate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      to_dog_id: string;
      park_name?: string;
      park_lat?: number;
      park_lng?: number;
      proposed_at?: string;
      message?: string;
    }) => {
      if (!d.to_dog_id) throw new Error("Pick a dog to invite.");
      if (d.message && d.message.length > 500)
        throw new Error("Message too long.");
      return d;
    },
  )
  .handler(async ({ context, data }) => {
    // resolve to_user_id
    const { data: dog, error: dogErr } = await context.supabase
      .from("dogs")
      .select("owner_id")
      .eq("id", data.to_dog_id)
      .single();
    if (dogErr || !dog) throw new Error("Dog not found.");
    if (dog.owner_id === context.userId)
      throw new Error("You can't invite your own dog.");

    const { error } = await context.supabase.from("playdate_requests").insert({
      from_user_id: context.userId,
      to_user_id: dog.owner_id,
      to_dog_id: data.to_dog_id,
      park_name: data.park_name ?? null,
      park_lat: data.park_lat ?? null,
      park_lng: data.park_lng ?? null,
      proposed_at: data.proposed_at ?? null,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyPlaydates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("playdate_requests")
      .select("*")
      .or(`from_user_id.eq.${context.userId},to_user_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const dogIds = Array.from(new Set((data ?? []).map((r) => r.to_dog_id)));
    const userIds = Array.from(
      new Set((data ?? []).flatMap((r) => [r.from_user_id, r.to_user_id])),
    );
    const [{ data: dogs }, { data: profiles }] = await Promise.all([
      context.supabase
        .from("dogs")
        .select("id, name")
        .in("id", dogIds.length ? dogIds : ["00000000-0000-0000-0000-000000000000"]),
      context.supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const dogMap = new Map(dogs?.map((d) => [d.id, d.name]) ?? []);
    const profMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

    return (data ?? []).map((r) => ({
      ...r,
      to_dog_name: dogMap.get(r.to_dog_id) ?? "their dog",
      from_display_name: profMap.get(r.from_user_id) ?? "Someone",
      to_display_name: profMap.get(r.to_user_id) ?? "Someone",
      _me: context.userId,
    })) as (Playdate & { _me: string; to_display_name: string })[];
  });

export const updatePlaydateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { id: string; status: "accepted" | "declined" | "cancelled" }) => d,
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("playdate_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
