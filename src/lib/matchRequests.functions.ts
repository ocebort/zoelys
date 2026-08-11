import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { rankMatches, type Petsitter, type MatchRequest } from "@/lib/matching";

// ------------------------------------------------------------
// PUBLIC: submit a match request (Get Matched form)
// ------------------------------------------------------------
const submitSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  area: z.string().trim().max(120).optional().nullable(),
  // pet
  animal: z.string().max(40).optional().nullable(),
  breed: z.string().max(80).optional().nullable(),
  petName: z.string().max(80).optional().nullable(),
  age: z.string().max(40).optional().nullable(),
  size: z.string().max(60).optional().nullable(),
  sex: z.string().max(20).optional().nullable(),
  temperament: z.string().max(60).optional().nullable(),
  houseTrained: z.string().max(40).optional().nullable(),
  traits: z.array(z.string().max(80)).max(20).optional().default([]),
  // health
  hasMedical: z.string().max(10).optional().nullable(),
  medicalDesc: z.string().max(2000).optional().nullable(),
  vaccines: z.string().max(60).optional().nullable(),
  parasite: z.string().max(60).optional().nullable(),
  diet: z.string().max(60).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  meals: z.union([z.string(), z.number()]).optional().nullable(),
  exercise: z.string().max(40).optional().nullable(),
  sleep: z.string().max(60).optional().nullable(),
  // service
  services: z.array(z.string().max(60)).max(10).optional().default([]),
  startDate: z.string().max(40).optional().nullable(),
  endDate: z.string().max(40).optional().nullable(),
  recurring: z.string().max(10).optional().nullable(),
  frequency: z.string().max(40).optional().nullable(),
  hours: z.union([z.string(), z.number()]).optional().nullable(),
  // preferences
  expLevel: z.string().max(60).optional().nullable(),
  outdoor: z.string().max(10).optional().nullable(),
  otherPets: z.string().max(10).optional().nullable(),
  children: z.string().max(10).optional().nullable(),
  genderPref: z.string().max(40).optional().nullable(),
  language: z.string().max(120).optional().nullable(),
  updates: z.string().max(80).optional().nullable(),
  otherQualities: z.string().max(2000).optional().nullable(),
  // final
  usedBefore: z.string().max(10).optional().nullable(),
  issues: z.string().max(2000).optional().nullable(),
  referral: z.string().max(60).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consent: z.boolean(),
});

type SubmitInput = z.input<typeof submitSchema>;

function parseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  // Already YYYY-MM-DD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseInt0(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

export const submitMatchRequest = createServerFn({ method: "POST" })
  .inputValidator((d: SubmitInput) => {
    const parsed = submitSchema.parse(d);
    if (!parsed.consent) throw new Error("Consent is required.");
    return parsed;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("match_requests")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        area: data.area ?? null,
        animal: data.animal ?? null,
        breed: data.breed ?? null,
        pet_name: data.petName ?? null,
        age: data.age ?? null,
        size: data.size ?? null,
        sex: data.sex ?? null,
        temperament: data.temperament ?? null,
        house_trained: data.houseTrained ?? null,
        traits: data.traits ?? [],
        has_medical: data.hasMedical ?? null,
        medical_desc: data.medicalDesc ?? null,
        vaccines: data.vaccines ?? null,
        parasite: data.parasite ?? null,
        diet: data.diet ?? null,
        allergies: data.allergies ?? null,
        meals: parseInt0(data.meals),
        exercise: data.exercise ?? null,
        sleep: data.sleep ?? null,
        services: data.services ?? [],
        start_date: parseDate(data.startDate),
        end_date: parseDate(data.endDate),
        recurring: data.recurring ?? null,
        frequency: data.frequency ?? null,
        hours: parseInt0(data.hours),
        exp_level: data.expLevel ?? null,
        outdoor: data.outdoor ?? null,
        other_pets: data.otherPets ?? null,
        children: data.children ?? null,
        gender_pref: data.genderPref ?? null,
        language: data.language ?? null,
        updates: data.updates ?? null,
        other_qualities: data.otherQualities ?? null,
        used_before: data.usedBefore ?? null,
        issues: data.issues ?? null,
        referral: data.referral ?? null,
        notes: data.notes ?? null,
        raw: data,
        status: "new",
      })
      .select("id, deadline_at")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id, deadline_at: row.deadline_at };
  });

// ------------------------------------------------------------
// ADMIN: list match requests
// ------------------------------------------------------------
export const listMatchRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("match_requests")
      .select("*")
      .order("deadline_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const getMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("match_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

type UpdateInput = {
  id: string;
  status?: "new" | "matched" | "completed" | "cancelled";
  matched_sitter_id?: string | null;
  admin_notes?: string;
};

export const updateMatchRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: UpdateInput) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "matched", "completed", "cancelled"]).optional(),
      matched_sitter_id: z.string().uuid().nullable().optional(),
      admin_notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      status?: "new" | "matched" | "completed" | "cancelled";
      matched_sitter_id?: string | null;
      admin_notes?: string | null;
    } = {};
    if (data.status) patch.status = data.status;
    if (data.matched_sitter_id !== undefined) patch.matched_sitter_id = data.matched_sitter_id;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    const { error } = await supabaseAdmin
      .from("match_requests")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------------------------------------------------------
// ADMIN: run matching algorithm for a request
// ------------------------------------------------------------
export const findMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: rErr } = await supabaseAdmin
      .from("match_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (rErr || !req) throw new Error(rErr?.message ?? "Request not found");

    const { data: sitters, error: sErr } = await supabaseAdmin
      .from("petsitters")
      .select("*")
      .eq("status", "approved");
    if (sErr) throw new Error(sErr.message);

    const matches = rankMatches(
      (sitters ?? []) as unknown as Petsitter[],
      req as unknown as MatchRequest,
      3,
    );
    return { matches };
  });
