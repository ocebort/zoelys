import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden — admin only.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 3_600_000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString();

    const countOf = async (
      table: "petsitters" | "match_requests" | "dogs" | "profiles" | "events" | "partners" | "playdate_requests",
      filter?: (q: any) => any,
      since?: string,
      sinceCol: string = "created_at",
    ): Promise<number> => {
      let q: any = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      if (since) q = q.gte(sinceCol, since);
      const { count, error } = await q;
      if (error) throw new Error(`${table}: ${error.message}`);
      return count ?? 0;
    };

    const [
      sittersTotal,
      sittersApproved,
      sittersPending,
      sittersPaused,
      sittersNewWeek,
      requestsTotal,
      requestsNew,
      requestsMatched,
      requestsLast24h,
      requestsLastWeek,
      requestsUrgent,
      dogsTotal,
      dogsNewWeek,
      profilesTotal,
      profilesNewMonth,
      eventsTotal,
      partnersTotal,
      playdatesTotal,
    ] = await Promise.all([
      countOf("petsitters"),
      countOf("petsitters", (q) => q.eq("status", "approved")),
      countOf("petsitters", (q) => q.eq("status", "pending")),
      countOf("petsitters", (q) => q.eq("status", "paused")),
      countOf("petsitters", undefined, weekAgo),
      countOf("match_requests"),
      countOf("match_requests", (q) => q.eq("status", "new")),
      countOf("match_requests", (q) => q.eq("status", "matched")),
      countOf("match_requests", undefined, dayAgo, "submitted_at"),
      countOf("match_requests", undefined, weekAgo, "submitted_at"),
      countOf("match_requests", (q) =>
        q.eq("status", "new").lt("deadline_at", new Date(now.getTime() + 6 * 3_600_000).toISOString()),
      ),
      countOf("dogs"),
      countOf("dogs", undefined, weekAgo),
      countOf("profiles"),
      countOf("profiles", undefined, monthAgo),
      countOf("events"),
      countOf("partners"),
      countOf("playdate_requests"),
    ]);

    // Recent activity (last 5 requests + last 5 sitters)
    const [{ data: recentReqs }, { data: recentSitters }] = await Promise.all([
      supabaseAdmin
        .from("match_requests")
        .select("id, full_name, pet_name, animal, area, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("petsitters")
        .select("id, full_name, status, neighborhoods, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Breakdowns: pull last 90 days of requests + all sitters
    const ninetyAgo = new Date(now.getTime() - 90 * 24 * 3_600_000).toISOString();
    const [{ data: reqRows }, { data: sitterRows }] = await Promise.all([
      supabaseAdmin
        .from("match_requests")
        .select("services, animal, area, status, submitted_at, start_date, end_date")
        .gte("submitted_at", ninetyAgo),
      supabaseAdmin
        .from("petsitters")
        .select("services, neighborhoods, animals, status, hourly_rate, daily_rate"),
    ]);

    const tally = (items: (string | null | undefined)[]) => {
      const m = new Map<string, number>();
      for (const raw of items) {
        if (!raw) continue;
        const k = String(raw).trim();
        if (!k) continue;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    };

    // Requested service "plans"
    const requestedServices = tally(
      (reqRows ?? []).flatMap((r) => (r.services as string[] | null) ?? []),
    );
    const requestedAnimals = tally((reqRows ?? []).map((r) => r.animal));
    const requestedAreas = tally((reqRows ?? []).map((r) => r.area)).slice(0, 8);
    const offeredServices = tally(
      (sitterRows ?? []).flatMap((s) => (s.services as string[] | null) ?? []),
    );
    const sitterCoverage = tally(
      (sitterRows ?? [])
        .filter((s) => s.status === "approved")
        .flatMap((s) => (s.neighborhoods as string[] | null) ?? []),
    ).slice(0, 8);

    // Requests-per-day (last 14 days)
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3_600_000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: 0 });
    }
    for (const r of reqRows ?? []) {
      const key = String(r.submitted_at).slice(0, 10);
      const bucket = days.find((d) => d.date === key);
      if (bucket) bucket.count++;
    }

    // Pricing snapshot (sitters)
    const approvedSitters = (sitterRows ?? []).filter((s) => s.status === "approved");
    const hourlyRates = approvedSitters
      .map((s) => Number(s.hourly_rate))
      .filter((n) => Number.isFinite(n) && n > 0);
    const dailyRates = approvedSitters
      .map((s) => Number(s.daily_rate))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avg = (xs: number[]) =>
      xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

    // Match conversion
    const matchedInWindow = (reqRows ?? []).filter((r) => r.status === "matched").length;
    const totalInWindow = (reqRows ?? []).length;
    const conversionRate = totalInWindow ? Math.round((matchedInWindow / totalInWindow) * 100) : 0;

    return {
      sitters: {
        total: sittersTotal,
        approved: sittersApproved,
        pending: sittersPending,
        paused: sittersPaused,
        new_this_week: sittersNewWeek,
      },
      requests: {
        total: requestsTotal,
        open: requestsNew,
        matched: requestsMatched,
        last_24h: requestsLast24h,
        last_week: requestsLastWeek,
        urgent: requestsUrgent,
        conversion_rate: conversionRate,
      },
      pets: {
        total: dogsTotal,
        new_this_week: dogsNewWeek,
      },
      users: {
        total: profilesTotal,
        new_this_month: profilesNewMonth,
      },
      content: {
        events: eventsTotal,
        partners: partnersTotal,
        playdates: playdatesTotal,
      },
      breakdowns: {
        requested_services: requestedServices,
        requested_animals: requestedAnimals,
        requested_areas: requestedAreas,
        offered_services: offeredServices,
        sitter_coverage: sitterCoverage,
      },
      pricing: {
        avg_hourly: avg(hourlyRates),
        avg_daily: avg(dailyRates),
        min_hourly: hourlyRates.length ? Math.min(...hourlyRates) : 0,
        max_hourly: hourlyRates.length ? Math.max(...hourlyRates) : 0,
      },
      requests_per_day: days,
      recent_requests: recentReqs ?? [],
      recent_sitters: recentSitters ?? [],
      generated_at: now.toISOString(),
    };
  });
