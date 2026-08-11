import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMatchRequests,
  getMatchRequest,
  findMatches,
  updateMatchRequest,
} from "@/lib/matchRequests.functions";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  ssr: false,
  component: AdminRequests,
});

type Req = Awaited<ReturnType<typeof listMatchRequests>>[number];
type MatchResult = Awaited<ReturnType<typeof findMatches>>;

function AdminRequests() {
  const list = useServerFn(listMatchRequests);
  const { data: reqs = [], isLoading, error } = useQuery({
    queryKey: ["match-requests"],
    queryFn: () => list(),
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = reqs.find((r) => r.id === selectedId) ?? null;

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-10 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="tracking-brand text-gold text-xs">— Admin</div>
          <h1 className="font-serif text-3xl mt-2">Match requests</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-8 px-6 grid md:grid-cols-[360px_1fr] gap-6">
        <div>
          {isLoading && <p className="text-ink/60">Loading…</p>}
          {error && <p className="text-red-700 text-sm">{String((error as Error).message)}</p>}
          <ul className="space-y-2">
            {reqs.map((r) => {
              const hrs = Math.round((new Date(r.deadline_at).getTime() - Date.now()) / 3_600_000);
              const urgent = hrs < 6 && r.status === "new";
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${
                      selectedId === r.id ? "border-gold bg-cream" : "border-navy/10 bg-white hover:border-gold"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-navy text-sm">{r.full_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "matched" ? "bg-green-100 text-green-800" :
                        r.status === "completed" ? "bg-slate-100 text-slate-700" :
                        r.status === "cancelled" ? "bg-red-100 text-red-700" :
                        urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {r.status === "new" ? (urgent ? `${hrs}h left` : `${hrs}h`) : r.status}
                      </span>
                    </div>
                    <div className="text-xs text-ink/60 mt-1">
                      {r.pet_name ?? "Pet"} ({r.animal ?? "?"}) · {r.area ?? "no area"}
                    </div>
                  </button>
                </li>
              );
            })}
            {!isLoading && reqs.length === 0 && (
              <li className="text-ink/60 italic text-sm">No match requests yet.</li>
            )}
          </ul>
        </div>

        <div>
          {selected ? (
            <RequestDetail request={selected} />
          ) : (
            <p className="text-ink/60 italic">Select a request to view details and find matches.</p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function RequestDetail({ request }: { request: Req }) {
  const find = useServerFn(findMatches);
  const update = useServerFn(updateMatchRequest);
  const qc = useQueryClient();

  const [matches, setMatches] = useState<MatchResult["matches"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runMatch() {
    setBusy(true);
    setErr(null);
    try {
      const res = await find({ data: { id: request.id } });
      setMatches(res.matches);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(sitterId: string) {
    await update({ data: { id: request.id, status: "matched", matched_sitter_id: sitterId } });
    qc.invalidateQueries({ queryKey: ["match-requests"] });
  }

  const hrsLeft = Math.round((new Date(request.deadline_at).getTime() - Date.now()) / 3_600_000);
  const urgent = hrsLeft < 6 && request.status === "new";

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-navy/10 rounded-lg overflow-hidden">
        <div className={`px-6 py-4 ${urgent ? "bg-red-50" : "bg-cream"}`}>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="font-serif text-2xl text-navy">{request.full_name}</h2>
              <p className="text-sm text-ink/60 mt-0.5">
                {request.email}{request.phone && ` · ${request.phone}`}
              </p>
              <p className="text-xs text-ink/50 mt-1">
                Submitted {new Date(request.submitted_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                request.status === "matched" ? "bg-green-100 text-green-800" :
                request.status === "completed" ? "bg-slate-100 text-slate-700" :
                request.status === "cancelled" ? "bg-red-100 text-red-700" :
                urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
              }`}>{request.status}</span>
              {request.status === "new" && (
                <div className={`text-xs mt-1 ${urgent ? "text-red-700 font-medium" : "text-ink/60"}`}>
                  {hrsLeft > 0 ? `${hrsLeft}h until deadline` : `${Math.abs(hrsLeft)}h overdue`}
                </div>
              )}
            </div>
          </div>

          {/* Snapshot row */}
          <div className="flex flex-wrap gap-2 mt-4">
            {request.animal && <Chip>{request.animal}</Chip>}
            {request.breed && <Chip>{request.breed}</Chip>}
            {request.size && <Chip>{request.size}</Chip>}
            {request.area && <Chip>📍 {request.area}</Chip>}
            {request.services?.slice(0, 3).map((s) => <Chip key={s} tone="gold">{s}</Chip>)}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-t border-navy/10 flex gap-3 items-center flex-wrap">
          <button onClick={runMatch} disabled={busy} className="btn-navy disabled:opacity-50">
            {busy ? "Finding…" : "🔍 Find matches"}
          </button>
          {request.status !== "cancelled" && (
            <button
              onClick={async () => {
                await update({ data: { id: request.id, status: "cancelled" } });
                qc.invalidateQueries({ queryKey: ["match-requests"] });
              }}
              className="text-sm text-ink/60 hover:text-red-700"
            >
              Cancel request
            </button>
          )}
          {err && <span className="text-sm text-red-700">{err}</span>}
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard icon="🐾" title="Pet profile">
          <Row k="Name" v={request.pet_name} />
          <Row k="Animal" v={request.animal} />
          <Row k="Breed" v={request.breed} />
          <Row k="Age" v={request.age} />
          <Row k="Size" v={request.size} />
          <Row k="Sex" v={request.sex} />
          <Row k="Temperament" v={request.temperament} />
          <Row k="Traits" v={request.traits?.join(", ")} />
          <Row k="House trained" v={request.house_trained} />
        </SectionCard>

        <SectionCard icon="📅" title="Service needed">
          <Row k="Services" v={request.services?.join(", ")} />
          <Row k="Start" v={request.start_date} />
          <Row k="End" v={request.end_date} />
          <Row k="Recurring" v={request.recurring} />
          <Row k="Frequency" v={request.frequency} />
          <Row k="Hours/day" v={request.hours} />
          <Row k="Area" v={request.area} />
        </SectionCard>

        <SectionCard icon="🩺" title="Health & care">
          <Row k="Medical" v={request.has_medical} />
          {request.medical_desc && <Row k="Details" v={request.medical_desc} />}
          <Row k="Vaccines" v={request.vaccines} />
          <Row k="Parasite tx" v={request.parasite} />
          <Row k="Diet" v={request.diet} />
          <Row k="Allergies" v={request.allergies} />
          <Row k="Meals/day" v={request.meals} />
          <Row k="Exercise" v={request.exercise} />
          <Row k="Sleep" v={request.sleep} />
        </SectionCard>

        <SectionCard icon="⭐" title="Sitter preferences">
          <Row k="Experience" v={request.exp_level} />
          <Row k="Outdoor needed" v={request.outdoor} />
          <Row k="Other pets OK" v={request.other_pets} />
          <Row k="Children OK" v={request.children} />
          <Row k="Gender pref" v={request.gender_pref} />
          <Row k="Language" v={request.language} />
          <Row k="Updates" v={request.updates} />
          <Row k="Other qualities" v={request.other_qualities} />
        </SectionCard>

        {(request.used_before || request.issues || request.referral) && (
          <SectionCard icon="💬" title="Background">
            <Row k="Used before" v={request.used_before} />
            <Row k="Past issues" v={request.issues} />
            <Row k="How they heard" v={request.referral} />
          </SectionCard>
        )}

        {request.notes && (
          <SectionCard icon="📝" title="Notes from owner">
            <p className="text-sm text-ink/80 italic">"{request.notes}"</p>
          </SectionCard>
        )}
      </div>

      {/* Matches */}
      {matches && (
        <div className="bg-white border border-navy/10 rounded-lg p-6">
          <h3 className="font-serif text-xl text-navy mb-4">Top {matches.length} matches</h3>
          {matches.length === 0 && (
            <p className="text-ink/60 italic">No approved sitters fit this request. Add or approve more sitters.</p>
          )}
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.sitter.id} className="border border-navy/10 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif text-lg text-navy">{m.sitter.full_name}</h4>
                    <p className="text-xs text-ink/60">
                      {m.sitter.experience_level} · {m.sitter.years_experience}y · {m.sitter.neighborhoods?.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif text-gold">{m.score}<span className="text-sm text-ink/50">/{m.max_score}</span></div>
                    <div className="text-xs text-ink/50">match score</div>
                  </div>
                </div>
                {m.reasons.length > 0 && (
                  <ul className="mt-3 text-xs text-green-800 space-y-1">
                    {m.reasons.map((r, i) => <li key={i}>✓ {r}</li>)}
                  </ul>
                )}
                {m.warnings.length > 0 && (
                  <ul className="mt-2 text-xs text-amber-800 space-y-1">
                    {m.warnings.map((r, i) => <li key={i}>⚠ {r}</li>)}
                  </ul>
                )}
                <div className="mt-3 flex justify-end">
                  <button onClick={() => confirm(m.sitter.id)} className="btn-gold text-sm py-2">
                    Confirm this match →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-navy/10 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-navy/10">
        <span className="text-lg">{icon}</span>
        <h3 className="font-serif text-navy">{title}</h3>
      </div>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Chip({ children, tone = "navy" }: { children: React.ReactNode; tone?: "navy" | "gold" }) {
  const c = tone === "gold" ? "bg-gold/15 text-navy border-gold/30" : "bg-white text-navy border-navy/15";
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${c}`}>{children}</span>;
}

function Row({ k, v }: { k: string; v: string | number | null | undefined }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div className="flex gap-2">
      <dt className="text-ink/50 min-w-[110px] shrink-0">{k}</dt>
      <dd className="text-navy">{v}</dd>
    </div>
  );
}
