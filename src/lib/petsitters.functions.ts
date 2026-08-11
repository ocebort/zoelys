import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sitterSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(40).optional().nullable(),
  photo_url: z.string().trim().max(1000).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  languages: z.array(z.string().max(40)).max(20).default([]),
  neighborhoods: z.array(z.string().max(80)).max(40).default([]),
  services: z.array(z.string().max(60)).max(10).default([]),
  animals: z.array(z.string().max(40)).max(20).default([]),
  size_capacity: z.array(z.string().max(20)).max(10).default([]),
  experience_level: z.string().max(60).default("Some experience"),
  years_experience: z.number().int().min(0).max(80).default(0),
  has_outdoor_space: z.boolean().default(false),
  accepts_other_pets: z.boolean().default(false),
  accepts_children: z.boolean().default(false),
  handles_medical: z.boolean().default(false),
  handles_aggressive: z.boolean().default(false),
  handles_anxious: z.boolean().default(false),
  gender: z.string().max(40).optional().nullable(),
  hourly_rate: z.number().min(0).max(10000).optional().nullable(),
  daily_rate: z.number().min(0).max(10000).optional().nullable(),
  max_concurrent_bookings: z.number().int().min(0).max(50).default(3),
  status: z.enum(["pending", "approved", "paused"]).default("pending"),
  admin_notes: z.string().max(2000).optional().nullable(),
});

export const listPetsitters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("petsitters")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createPetsitter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sitterSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = { ...data, email: data.email || null };
    const { data: inserted, error } = await supabaseAdmin
      .from("petsitters")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const updatePetsitter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: unknown }) =>
    z.object({ id: z.string().uuid(), patch: sitterSchema.partial() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = { ...data.patch };
    if (patch.email === "") patch.email = null;
    const { error } = await supabaseAdmin
      .from("petsitters")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePetsitter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("petsitters")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
