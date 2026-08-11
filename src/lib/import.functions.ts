import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QUERIES: Record<string, string> = {
  park: "best dog parks in Miami Florida",
  vet: "best veterinarians and animal hospitals in Miami Florida",
  groomer: "best dog groomers and daycare in Miami Florida",
  cafe: "dog-friendly cafes and restaurants in Miami Florida",
};

type ImportInput = {
  category: "park" | "vet" | "groomer" | "cafe";
  limit?: number;
};

export const importMiamiPlaces = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ImportInput) => {
    if (!QUERIES[d.category]) throw new Error("Invalid category.");
    return d;
  })
  .handler(async ({ context, data }) => {
    // Admin gate
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("Firecrawl is not connected.");

    const limit = Math.min(Math.max(data.limit ?? 8, 1), 15);

    // 1) Firecrawl search
    const sRes = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERIES[data.category], limit }),
    });
    if (!sRes.ok)
      throw new Error(`Firecrawl search failed (${sRes.status})`);
    const sJson = await sRes.json();
    const results: { url: string; title?: string; description?: string }[] =
      sJson.data?.web ?? sJson.web ?? sJson.data ?? [];

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const inserted: { name: string; address: string }[] = [];
    const skipped: { url: string; reason: string }[] = [];

    for (const r of results.slice(0, limit)) {
      try {
        // 2) Scrape with structured JSON extraction
        const sc = await fetch("https://api.firecrawl.dev/v2/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: r.url,
            onlyMainContent: true,
            formats: [
              {
                type: "json",
                prompt:
                  "Extract the primary business: name, full street address (must be in Miami area, FL), phone, and official website URL.",
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                    website: { type: "string" },
                  },
                  required: ["name", "address"],
                },
              },
            ],
          }),
        });
        if (!sc.ok) {
          skipped.push({ url: r.url, reason: `scrape ${sc.status}` });
          continue;
        }
        const scJson = await sc.json();
        const ext = scJson.data?.json ?? scJson.json ?? {};
        if (!ext.address) {
          skipped.push({ url: r.url, reason: "no address" });
          continue;
        }

        // 3) Geocode via Nominatim (free, no key)
        const q = encodeURIComponent(`${ext.address}, Miami, FL`);
        const g = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=us`,
          { headers: { "User-Agent": "Zoelys-Miami-Pets/1.0" } },
        );
        const gJson = await g.json();
        if (!gJson[0]) {
          skipped.push({ url: r.url, reason: "geocode failed" });
          await new Promise((res) => setTimeout(res, 1100));
          continue;
        }
        const lat = parseFloat(gJson[0].lat);
        const lng = parseFloat(gJson[0].lon);

        // 4) Dedup by name+address
        const { data: existing } = await supabaseAdmin
          .from("partners")
          .select("id")
          .ilike("name", ext.name)
          .ilike("address", `%${ext.address.slice(0, 20)}%`)
          .maybeSingle();
        if (existing) {
          skipped.push({ url: r.url, reason: "duplicate" });
          await new Promise((res) => setTimeout(res, 1100));
          continue;
        }

        // 5) Insert as unpublished (admin must review)
        const { error: insErr } = await supabaseAdmin.from("partners").insert({
          name: ext.name,
          category: data.category,
          description: r.description?.slice(0, 240) ?? null,
          address: ext.address,
          city: "Miami",
          lat,
          lng,
          website: ext.website || r.url,
          phone: ext.phone || null,
          is_published: true,
        });
        if (insErr) {
          skipped.push({ url: r.url, reason: insErr.message });
        } else {
          inserted.push({ name: ext.name, address: ext.address });
        }

        // Nominatim politeness: 1 req/sec
        await new Promise((res) => setTimeout(res, 1100));
      } catch (e) {
        skipped.push({
          url: r.url,
          reason: e instanceof Error ? e.message : "error",
        });
      }
    }

    return {
      inserted_count: inserted.length,
      skipped_count: skipped.length,
      inserted,
      skipped,
    };
  });

export const publishPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_published: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("partners")
      .update({ is_published: data.is_published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getUnpublishedPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("partners")
      .select("*")
      .eq("is_published", false)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

// ============================================================
// Google Places (New) import — much richer than Firecrawl
// ============================================================

export const GOOGLE_QUERIES: Record<string, string> = {
  park: "dog parks in Miami, FL",
  vet: "veterinarians in Miami, FL",
  groomer: "dog groomers in Miami, FL",
  cafe: "dog-friendly cafes in Miami, FL",
  boutique: "pet stores in Miami, FL",
  daycare: "dog daycare and boarding in Miami, FL",
  training: "dog training in Miami, FL",
};

type GoogleImportInput = {
  category: keyof typeof GOOGLE_QUERIES;
  autoPublish?: boolean;
};

export async function runGoogleImport(
  category: keyof typeof GOOGLE_QUERIES,
  autoPublish: boolean,
) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey || !gKey)
    throw new Error("Google Maps connector is not configured.");

  const res = await fetch(
    "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.editorialSummary,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery: GOOGLE_QUERIES[category],
        pageSize: 20,
        locationBias: {
          circle: {
            center: { latitude: 25.7617, longitude: -80.1918 },
            radius: 30000,
          },
        },
      }),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Places failed (${res.status}): ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const places: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    editorialSummary?: { text?: string };
    rating?: number;
    userRatingCount?: number;
  }> = json.places ?? [];

  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const inserted: { name: string; address: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const p of places) {
    const name = p.displayName?.text;
    const address = p.formattedAddress;
    const lat = p.location?.latitude;
    const lng = p.location?.longitude;
    if (!name || !address || lat == null || lng == null) {
      skipped.push({ name: name ?? p.id, reason: "missing fields" });
      continue;
    }

    const { data: existing } = await supabaseAdmin
      .from("partners")
      .select("id")
      .ilike("name", name)
      .maybeSingle();
    if (existing) {
      skipped.push({ name, reason: "duplicate" });
      continue;
    }

    const { error: insErr } = await supabaseAdmin.from("partners").insert({
      name,
      category: category as "park" | "vet" | "groomer" | "cafe" | "boutique" | "daycare" | "training",
      description:
        p.editorialSummary?.text ??
        (p.rating
          ? `★ ${p.rating} (${p.userRatingCount ?? 0} reviews on Google)`
          : null),
      address,
      city: "Miami",
      lat,
      lng,
      website: p.websiteUri ?? null,
      phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? null,
      is_published: autoPublish,
    });
    if (insErr) {
      skipped.push({ name, reason: insErr.message });
    } else {
      inserted.push({ name, address });
    }
  }

  return {
    inserted_count: inserted.length,
    skipped_count: skipped.length,
    inserted,
    skipped,
  };
}

export const importFromGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: GoogleImportInput) => {
    if (!GOOGLE_QUERIES[d.category]) throw new Error("Invalid category.");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    return runGoogleImport(data.category, data.autoPublish ?? true);
  });

export const importAllFromGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const cats = Object.keys(GOOGLE_QUERIES) as Array<keyof typeof GOOGLE_QUERIES>;
    let total = 0;
    let dupes = 0;
    const perCat: Record<string, number> = {};
    for (const c of cats) {
      const r = await runGoogleImport(c, true);
      total += r.inserted_count;
      dupes += r.skipped_count;
      perCat[c] = r.inserted_count;
    }
    return { total, dupes, perCat };
  });
