import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyPlaydates,
  updatePlaydateStatus,
} from "@/lib/playdates.functions";

export const Route = createFileRoute("/_authenticated/playdates")({
  head: () => ({ meta: [{ title: "Playdates — Zoélys" }] }),
  loader: () => getMyPlaydates(),
  component: PlaydatesPage,
});

function PlaydatesPage() {
  const { data } = useSuspenseQuery({
    queryKey: ["my-playdates"],
    queryFn: () => getMyPlaydates(),
  });
  const qc = useQueryClient();
  const update = useServerFn(updatePlaydateStatus);

  async function act(id: string, status: "accepted" | "declined" | "cancelled") {
    await update({ data: { id, status } });
    qc.invalidateQueries({ queryKey: ["my-playdates"] });
  }

  const inbox = data.filter((r) => r.to_user_id === r._me);
  const outbox = data.filter((r) => r.from_user_id === r._me);

  return (
    <SiteLayout>
      <section className="bg-espresso text-cream py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="tracking-brand text-terracotta-soft text-xs">
            — Community
          </div>
          <h1 className="font-serif text-4xl mt-2">Playdates</h1>
        </div>
      </section>

      <section className="py-12 px-6 bg-cream">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="font-serif text-2xl text-espresso mb-5">
              Invites received
            </h2>
            {inbox.length === 0 && (
              <p className="text-espresso/60 italic">Nothing yet.</p>
            )}
            <div className="space-y-3">
              {inbox.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-espresso/10 rounded-2xl p-5"
                >
                  <div className="text-xs text-terracotta tracking-[0.18em] uppercase">
                    {r.status}
                  </div>
                  <div className="font-serif text-lg text-espresso mt-1">
                    {r.from_display_name} wants to meet {r.to_dog_name}
                  </div>
                  {r.park_name && (
                    <div className="text-sm text-espresso/70 mt-1">
                      📍 {r.park_name}
                    </div>
                  )}
                  {r.proposed_at && (
                    <div className="text-sm text-espresso/70">
                      🗓 {new Date(r.proposed_at).toLocaleString()}
                    </div>
                  )}
                  {r.message && (
                    <p className="text-sm text-espresso/80 mt-2 italic">
                      "{r.message}"
                    </p>
                  )}
                  {r.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => act(r.id, "accepted")}
                        className="bg-terracotta text-cream rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => act(r.id, "declined")}
                        className="border border-espresso/20 text-espresso rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-espresso mb-5">
              Invites you sent
            </h2>
            {outbox.length === 0 && (
              <p className="text-espresso/60 italic">Nothing yet.</p>
            )}
            <div className="space-y-3">
              {outbox.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-espresso/10 rounded-2xl p-5"
                >
                  <div className="text-xs text-terracotta tracking-[0.18em] uppercase">
                    {r.status}
                  </div>
                  <div className="font-serif text-lg text-espresso mt-1">
                    To {r.to_display_name} · {r.to_dog_name}
                  </div>
                  {r.park_name && (
                    <div className="text-sm text-espresso/70 mt-1">
                      📍 {r.park_name}
                    </div>
                  )}
                  {r.proposed_at && (
                    <div className="text-sm text-espresso/70">
                      🗓 {new Date(r.proposed_at).toLocaleString()}
                    </div>
                  )}
                  {r.status === "pending" && (
                    <button
                      onClick={() => act(r.id, "cancelled")}
                      className="mt-3 text-xs uppercase tracking-[0.18em] text-espresso/60 hover:text-red-700"
                    >
                      Cancel invite
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
