import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Dog = {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: "small" | "medium" | "large" | "xlarge" | null;
  age_years: number | null;
  bio: string | null;
  photo_url: string | null;
  show_on_map: boolean;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  owner_display_name?: string | null;
  owner_avatar_url?: string | null;
};

export const getMyDogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dogs")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Dog[];
  });

export const getMapDogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dogs")
      .select(
        "id, owner_id, name, breed, size, age_years, bio, photo_url, lat, lng, neighborhood, show_on_map, is_published",
      )
      .eq("show_on_map", true)
      .eq("is_published", true)
      .not("lat", "is", null)
      .not("lng", "is", null);
    if (error) throw new Error(error.message);

    // attach owner profiles
    const ownerIds = Array.from(new Set((data ?? []).map((d) => d.owner_id)));
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    return (data ?? []).map((d) => ({
      ...d,
      owner_display_name: map.get(d.owner_id)?.display_name ?? "A neighbor",
      owner_avatar_url: map.get(d.owner_id)?.avatar_url ?? null,
    })) as Dog[];
  });

export const saveDog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      name: string;
      breed?: string;
      size?: "small" | "medium" | "large" | "xlarge";
      age_years?: number;
      bio?: string;
      photo_url?: string;
      show_on_map: boolean;
      lat?: number;
      lng?: number;
      neighborhood?: string;
    }) => {
      if (!d.name || d.name.length < 1 || d.name.length > 80)
        throw new Error("Name is required (max 80 chars).");
      if (d.show_on_map && (d.lat == null || d.lng == null))
        throw new Error("Add a location to show on the map.");
      return d;
    },
  )
  .handler(async ({ context, data }) => {
    const payload = {
      owner_id: context.userId,
      name: data.name,
      breed: data.breed ?? null,
      size: data.size ?? null,
      age_years: data.age_years ?? null,
      bio: data.bio ?? null,
      photo_url: data.photo_url ?? null,
      show_on_map: data.show_on_map,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      neighborhood: data.neighborhood ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("dogs")
        .update(payload)
        .eq("id", data.id)
        .eq("owner_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("dogs")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteDog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("dogs")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
