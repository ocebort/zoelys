import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats } from "@/lib/adminStats.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  ssr: false,
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStats);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
    refetchInterval: 60_000,
  });

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-10 px-6">
        <div className="mx-auto max-w-7xl flex justify-between items-end gap-4 flex-wrap">
          <div>
            <div className="tracking-brand text-gold text-xs">— Admin</div>
            <h1 className="font-serif text-3xl mt-2">Dashboard</h1>
            <p className="text-cream/70 text-sm mt-1">Live overview of Zoélys activity</p>
          </div>
          <div className="flex gap-3 items-center text-xs text-cream/60">
            {data && <span>Updated {new Date(data.generated_at).toLocaleTimeString()}</span>}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-gold hover:underline disabled:opacity-50"
            >
              {isFetching ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto py-8 px-6 space-y-10">
        {isLoading && <p className="text-ink/60">Loading stats…</p>}
        {error && <p className="text-red-700">{String((error as Error).message)}</p>}

        {data && (
          <>
            {data.requests.urgent > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex justify-between items-center">
                <div>
                  <div className="font-medium text-red-900">
                    ⚠ {data.requests.urgent} urgent request{data.requests.urgent > 1 ? "s" : ""}
                  </div>
                  <p className="text-sm text-red-800/80">Deadline in less than 6h</p>
                </div>
                <Link to="/admin/requests" className="btn-navy text-sm py-2">View →</Link>
              </div>
            )}

            {/* Highlight strip */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <BigStat
                label="Active sitters"
                value={data.sitters.approved}
                hint={`${data.sitters.total} total · +${data.sitters.new_this_week} this week`}
                tone="green"
              />
              <BigStat
                label="Open requests"
                value={data.requests.open}
                hint={`${data.requests.urgent} urgent · ${data.requests.last_24h} in 24h`}
                tone={data.requests.urgent > 0 ? "red" : "navy"}
              />
              <BigStat
                label="Match rate (90d)"
                value={`${data.requests.conversion_rate}%`}
                hint={`${data.requests.matched} matched all-time`}
                tone="gold"
              />
              <BigStat
                label="Pet owners"
                value={data.users.total}
                hint={`+${data.users.new_this_month} this month · ${data.pets.total} pets`}
                tone="navy"
              />
            </div>

            {/* Requests over time */}
            <Section title="Requests over time" subtitle="Last 14 days">
              <DailyBarChart data={data.requests_per_day} />
            </Section>

            {/* Service "plans" */}
            <Section
              title="Most requested services"
              subtitle="Which 'plans' pet owners ask for (last 90 days)"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <BreakdownList
                  title="Requested by owners"
                  items={data.breakdowns.requested_services}
                  emptyHint="No requests yet."
                />
                <BreakdownList
                  title="Offered by sitters"
                  items={data.breakdowns.offered_services}
                  emptyHint="No sitters yet."
                  tone="gold"
                />
              </div>
            </Section>

            {/* Geo + Animal breakdowns */}
            <Section title="Where & what" subtitle="Demand and supply by area and animal">
              <div className="grid md:grid-cols-3 gap-6">
                <BreakdownList
                  title="Top areas (requests)"
                  items={data.breakdowns.requested_areas}
                  emptyHint="No areas yet."
                />
                <BreakdownList
                  title="Sitter coverage"
                  items={data.breakdowns.sitter_coverage}
                  emptyHint="No active sitters."
                  tone="gold"
                />
                <BreakdownList
                  title="Animal types"
                  items={data.breakdowns.requested_animals}
                  emptyHint="No animal data."
                />
              </div>
            </Section>

            {/* Pricing snapshot */}
            <Section title="Pricing snapshot" subtitle="Across approved sitters">
              <div className="grid sm:grid-cols-4 gap-4">
                <MiniStat label="Avg hourly" value={`$${data.pricing.avg_hourly}`} />
                <MiniStat label="Avg daily" value={`$${data.pricing.avg_daily}`} />
                <MiniStat label="Lowest hourly" value={`$${data.pricing.min_hourly}`} />
                <MiniStat label="Highest hourly" value={`$${data.pricing.max_hourly}`} />
              </div>
            </Section>

            {/* Sitter pipeline + community */}
            <Section title="Pipeline & community">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MiniStat label="Pending sitters" value={data.sitters.pending} sub="Awaiting approval" />
                <MiniStat label="Paused sitters" value={data.sitters.paused} sub="Temporarily off" />
                <MiniStat label="Events live" value={data.content.events} sub="Published" />
                <MiniStat label="Partners" value={data.content.partners} sub="In directory" />
              </div>
            </Section>

            {/* Recent activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Panel title="Recent match requests" link={{ to: "/admin/requests", label: "See all" }}>
                {data.recent_requests.length === 0 && <Empty>No requests yet.</Empty>}
                <ul className="divide-y divide-navy/10">
                  {data.recent_requests.map((r) => (
                    <li key={r.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium text-navy">{r.full_name}</div>
                        <div className="text-xs text-ink/60">
                          {r.pet_name ?? "Pet"} ({r.animal ?? "?"}) · {r.area ?? "no area"}
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusPill status={r.status} />
                        <div className="text-[11px] text-ink/50 mt-1">{timeAgo(r.submitted_at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Recent pet sitters" link={{ to: "/admin/petsitters", label: "Manage" }}>
                {data.recent_sitters.length === 0 && <Empty>No sitters yet.</Empty>}
                <ul className="divide-y divide-navy/10">
                  {data.recent_sitters.map((s) => (
                    <li key={s.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium text-navy">{s.full_name}</div>
                        <div className="text-xs text-ink/60">
                          {s.neighborhoods?.slice(0, 3).join(", ") || "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusPill status={s.status} />
                        <div className="text-[11px] text-ink/50 mt-1">{timeAgo(s.created_at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <QuickLink to="/admin/requests" title="Match requests" desc="Review & assign sitters" />
              <QuickLink to="/admin/petsitters" title="Pet sitter directory" desc="Approve, edit, pause" />
              <QuickLink to="/admin/import" title="Data import" desc="Scrape parks, vets…" />
            </div>
          </>
        )}
      </section>
    </SiteLayout>
  );
}

/* ───────── helpers ───────── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const toneClasses: Record<string, { ring: string; v: string; bg: string }> = {
  navy: { ring: "border-navy/15", v: "text-navy", bg: "bg-white" },
  green: { ring: "border-green-200", v: "text-green-700", bg: "bg-green-50/40" },
  red: { ring: "border-red-200", v: "text-red-700", bg: "bg-red-50/40" },
  gold: { ring: "border-gold/40", v: "text-gold", bg: "bg-gold/5" },
  amber: { ring: "border-amber-200", v: "text-amber-700", bg: "bg-amber-50/40" },
};

function BigStat({ label, value, hint, tone = "navy" }: { label: string; value: number | string; hint?: string; tone?: keyof typeof toneClasses }) {
  const t = toneClasses[tone];
  return (
    <div className={`rounded-xl border ${t.ring} ${t.bg} p-5`}>
      <div className="text-xs uppercase tracking-wide text-ink/60">{label}</div>
      <div className={`font-serif text-4xl mt-2 ${t.v}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      {hint && <div className="text-xs text-ink/60 mt-2">{hint}</div>}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border border-navy/10 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-ink/60">{label}</div>
      <div className="font-serif text-2xl text-navy mt-1">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-ink/50 mt-1">{sub}</div>}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-xl text-navy">{title}</h2>
        {subtitle && <p className="text-xs text-ink/60 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Panel({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-navy/10 rounded-lg p-5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-serif text-lg text-navy">{title}</h3>
        {link && <Link to={link.to} className="text-xs text-gold hover:underline">{link.label} →</Link>}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink/50 italic py-2">{children}</p>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-amber-100 text-amber-800",
    matched: "bg-green-100 text-green-800",
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-red-100 text-red-700",
    approved: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    paused: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${map[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="block bg-cream border border-navy/10 rounded-lg p-4 hover:border-gold transition">
      <div className="font-medium text-navy">{title}</div>
      <div className="text-xs text-ink/60 mt-1">{desc}</div>
    </Link>
  );
}

function BreakdownList({ title, items, emptyHint, tone = "navy" }: {
  title: string;
  items: { label: string; count: number }[];
  emptyHint: string;
  tone?: "navy" | "gold";
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const barColor = tone === "gold" ? "bg-gold" : "bg-navy";
  return (
    <div className="bg-white border border-navy/10 rounded-lg p-5">
      <h3 className="font-serif text-navy mb-3">{title}</h3>
      {items.length === 0 ? (
        <Empty>{emptyHint}</Empty>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 8).map((i) => {
            const pct = total ? Math.round((i.count / total) * 100) : 0;
            return (
              <li key={i.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-navy truncate pr-2">{i.label}</span>
                  <span className="text-ink/60 tabular-nums">{i.count} <span className="text-ink/40">· {pct}%</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-navy/5 mt-1 overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DailyBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="bg-white border border-navy/10 rounded-lg p-5">
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d) => {
          const h = (d.count / max) * 100;
          const label = new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative">
              <div
                className="w-full bg-navy/80 hover:bg-gold transition rounded-t"
                style={{ height: `${Math.max(h, 2)}%` }}
                title={`${label}: ${d.count}`}
              />
              <span className="absolute -top-5 text-[10px] text-navy opacity-0 group-hover:opacity-100 bg-cream px-1 rounded">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-ink/50 mt-2">
        <span>{new Date(data[0]?.date ?? Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
