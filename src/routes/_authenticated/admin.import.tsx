import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  importMiamiPlaces,
  publishPartner,
  getUnpublishedPartners,
  importAllFromGoogle,
} from "@/lib/import.functions";

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({ meta: [{ title: "Import Partners — Admin" }] }),
  loader: () => getUnpublishedPartners(),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="py-32 text-center px-6">
        <h1 className="font-serif text-3xl text-espresso">Admin only</h1>
        <p className="mt-3 text-espresso/60 text-sm">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: AdminImportPage,
});

const CATEGORIES = [
  { key: "park", label: "Dog parks" },
  { key: "vet", label: "Vets" },
  { key: "groomer", label: "Groomers & daycare" },
  { key: "cafe", label: "Pet-friendly cafés" },
] as const;

function AdminImportPage() {
  const { data: pending } = useSuspenseQuery({
    queryKey: ["unpublished-partners"],
    queryFn: () => getUnpublishedPartners(),
  });
  const qc = useQueryClient();
  const runImport = useServerFn(importMiamiPlaces);
  const publish = useServerFn(publishPartner);
  const runGoogleAll = useServerFn(importAllFromGoogle);

  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);

  async function doGoogleAll() {
    setBusy("google-all");
    setReport(null);
    try {
      const res = await runGoogleAll({});
      const breakdown = Object.entries(res.perCat)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      setReport(
        `✓ Imported ${res.total} places from Google (${breakdown}). ${res.dupes} duplicates skipped. Published live on the map.`,
      );
      qc.invalidateQueries({ queryKey: ["unpublished-partners"] });
    } catch (e) {
      setReport(`Google import failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(null);
    }
  }

  async function doImport(category: typeof CATEGORIES[number]["key"]) {
    setBusy(category);
    setReport(null);
    try {
      const res = await runImport({ data: { category, limit: 8 } });
      setReport(
        `✓ Added ${res.inserted_count} ${category}s. Skipped ${res.skipped_count}.`,
      );
      qc.invalidateQueries({ queryKey: ["unpublished-partners"] });
    } catch (e) {
      setReport(`Import failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(null);
    }
  }

  async function togglePublish(id: string, current: boolean) {
    await publish({ data: { id, is_published: !current } });
    qc.invalidateQueries({ queryKey: ["unpublished-partners"] });
  }

  return (
    <SiteLayout>
      <section className="bg-espresso text-cream py-10 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="tracking-brand text-terracotta-soft text-xs">
            — Admin
          </div>
          <h1 className="font-serif text-3xl mt-2">Import Miami partners</h1>
          <p className="text-cream/70 text-sm mt-2 max-w-xl">
            Scrape the web for new pet businesses. Results land here as drafts —
            review and publish to send them live on the map.
          </p>
        </div>
      </section>

      <section className="py-10 px-6 bg-cream">
        <div className="mx-auto max-w-5xl">
          <div className="bg-espresso text-cream rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="tracking-brand text-terracotta-soft text-xs">— One-click</div>
              <h2 className="font-serif text-2xl mt-1">Import everything from Google</h2>
              <p className="text-cream/70 text-sm mt-1 max-w-md">
                Pulls vets, parks, groomers, cafés, pet stores, daycares & trainers across Miami from Google Places. Auto-published live on the map.
              </p>
            </div>
            <button
              onClick={doGoogleAll}
              disabled={busy !== null}
              className="bg-terracotta hover:bg-terracotta/90 text-cream rounded-full px-6 py-4 text-xs uppercase tracking-[0.18em] disabled:opacity-50 whitespace-nowrap"
            >
              {busy === "google-all" ? "Importing…" : "Import from Google"}
            </button>
          </div>

          <h3 className="font-serif text-lg text-espresso mb-3">Or scrape by category (drafts)</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => doImport(c.key)}
                disabled={busy !== null}
                className="bg-white border border-espresso/15 hover:border-terracotta text-espresso rounded-full px-5 py-3 text-xs uppercase tracking-[0.18em] disabled:opacity-50"
              >
                {busy === c.key ? "Scraping…" : `Scrape ${c.label}`}
              </button>
            ))}
          </div>
          {report && (
            <p className="text-sm text-espresso/80 mb-6 bg-white p-3 rounded-lg border border-espresso/10">
              {report}
            </p>
          )}

          <h2 className="font-serif text-2xl text-espresso mt-10 mb-4">
            Drafts ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.length === 0 && (
              <p className="text-espresso/60 italic">No drafts pending.</p>
            )}
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-4 bg-white border border-espresso/10 rounded-2xl p-5"
              >
                <div className="flex-1">
                  <div className="text-xs text-terracotta tracking-[0.18em] uppercase">
                    {p.category}
                  </div>
                  <div className="font-serif text-lg text-espresso mt-1">
                    {p.name}
                  </div>
                  <p className="text-xs text-espresso/60 mt-1">{p.address}</p>
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-terracotta hover:underline"
                    >
                      {p.website}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => togglePublish(p.id, p.is_published)}
                  className="bg-espresso text-cream rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]"
                >
                  Publish
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
