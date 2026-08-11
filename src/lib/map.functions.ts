import { createServerFn } from "@tanstack/react-start";

export type MapPin = {
  id: string;
  type: "partner" | "event";
  name: string;
  category: string;
  meta: string;
  address: string;
  lat: number;
  lng: number;
  url: string | null;
  phone: string | null;
};

export const getMapPins = createServerFn({ method: "GET" }).handler(
  async (): Promise<MapPin[]> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const [partnersRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("partners")
        .select(
          "id, name, category, description, address, lat, lng, website, phone",
        )
        .eq("is_published", true),
      supabaseAdmin
        .from("events")
        .select(
          "id, title, description, starts_at, venue, address, lat, lng, rsvp_url",
        )
        .eq("is_published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true }),
    ]);

    if (partnersRes.error) throw new Error(partnersRes.error.message);
    if (eventsRes.error) throw new Error(eventsRes.error.message);

    const partners: MapPin[] = (partnersRes.data ?? []).map((p) => ({
      id: p.id,
      type: "partner",
      name: p.name,
      category: p.category,
      meta: p.description ?? labelForCategory(p.category),
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      url: p.website,
      phone: p.phone,
    }));

    const events: MapPin[] = (eventsRes.data ?? []).map((e) => ({
      id: e.id,
      type: "event",
      name: e.title,
      category: "event",
      meta: `${formatDate(e.starts_at)} · ${e.venue}`,
      address: e.address,
      lat: e.lat,
      lng: e.lng,
      url: e.rsvp_url,
      phone: null,
    }));

    return [...partners, ...events];
  },
);

function labelForCategory(c: string) {
  const map: Record<string, string> = {
    vet: "Veterinary care",
    groomer: "Grooming",
    boutique: "Boutique",
    cafe: "Pet-friendly café",
    park: "Dog park",
    training: "Training",
    daycare: "Daycare",
    other: "Partner",
  };
  return map[c] ?? "Partner";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
