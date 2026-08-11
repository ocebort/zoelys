import { createFileRoute } from "@tanstack/react-router";
import { GOOGLE_QUERIES, runGoogleImport } from "@/lib/import.functions";

export const Route = createFileRoute("/api/public/hooks/scrape-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate via Supabase anon/publishable key in the apikey header
        const apiKey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          process.env.SUPABASE_ANON_KEY;
        if (!apiKey || !expected || apiKey !== expected) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        const cats = Object.keys(GOOGLE_QUERIES) as Array<
          keyof typeof GOOGLE_QUERIES
        >;
        const perCat: Record<string, number> = {};
        let total = 0;
        let dupes = 0;
        const errors: Record<string, string> = {};

        for (const c of cats) {
          try {
            const r = await runGoogleImport(c, true);
            perCat[c] = r.inserted_count;
            total += r.inserted_count;
            dupes += r.skipped_count;
          } catch (e) {
            errors[c] = e instanceof Error ? e.message : "error";
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            total_inserted: total,
            total_skipped: dupes,
            per_category: perCat,
            errors,
            ran_at: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
