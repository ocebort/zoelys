import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { lazy, Suspense, useMemo, useState } from "react";
import {
  useSuspenseQuery,
  useQuery,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMapPins } from "@/lib/map.functions";
import { getMapDogs, type Dog } from "@/lib/dogs.functions";
import { createPlaydate } from "@/lib/playdates.functions";
import { useAuth } from "@/hooks/useAuth";

const pinsQueryOptions = queryOptions({
  queryKey: ["map-pins"],
  queryFn: () => getMapPins(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Map — Zoélys" },
      {
        name: "description",
        content:
          "Discover Miami's vetted pet partners, dog parks and the dogs in your neighborhood looking for playdates.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(pinsQueryOptions),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="py-32 text-center px-6">
        <h1 className="font-serif text-3xl text-espresso">
          The map didn't load
        </h1>
        <p className="mt-3 text-espresso/60 text-sm">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="py-32 text-center font-serif text-espresso">
        Nothing here.
      </div>
    </SiteLayout>
  ),
  component: MapPage,
});

const MapView = lazy(() =>
  import("@/components/map/MapView").then((m) => ({ default: m.MapView })),
);
import { CATEGORY_STYLE } from "@/components/map/MapView";

const LEGEND_KEYS = ["dog", "event", "vet", "park", "groomer", "cafe", "boutique", "training"];

function MapLegend() {
  return (
    <div className="absolute top-4 right-4 z-[1000] bg-cream/95 backdrop-blur border border-espresso/15 rounded-2xl p-4 shadow-lg max-w-[180px]">
      <div className="tracking-brand text-terracotta text-[0.6rem] mb-3">— Legend</div>
      <ul className="space-y-2">
        {LEGEND_KEYS.map((k) => {
          const s = CATEGORY_STYLE[k];
          if (!s) return null;
          return (
            <li key={k} className="flex items-center gap-2 text-xs text-espresso">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold border border-cream shrink-0"
                style={{ background: s.bg }}
              >
                {s.glyph}
              </span>
              {s.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const filters = ["All", "Partners", "Events", "Dogs"] as const;
type Filter = (typeof filters)[number];

function MapPage() {
  const { data: pins } = useSuspenseQuery(pinsQueryOptions);
  const { user, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>("All");
  const [invitingDog, setInvitingDog] = useState<Dog | null>(null);

  const { data: dogs = [] } = useQuery({
    queryKey: ["map-dogs"],
    queryFn: () => getMapDogs(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const dogPins = useMemo(
    () =>
      dogs
        .filter(
          (d) => d.lat != null && d.lng != null && d.owner_id !== user?.id,
        )
        .map((d) => ({ ...d, lat: d.lat as number, lng: d.lng as number })),
    [dogs, user],
  );

  const filteredPins = useMemo(() => {
    const base = pins.filter((p) => p.category !== "daycare");
    if (filter === "Partners") return base.filter((p) => p.type === "partner");
    if (filter === "Events") return base.filter((p) => p.type === "event");
    if (filter === "Dogs") return [];
    return base;
  }, [pins, filter]);

  const filteredDogs = filter === "Partners" || filter === "Events" ? [] : dogPins;

  return (
    <SiteLayout>
      <section className="bg-espresso text-cream py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="tracking-brand text-terracotta-soft">— Explore</div>
            <h1 className="font-serif text-3xl md:text-4xl mt-2">
              The Zoélys map of Miami
            </h1>
            <p className="text-cream/70 text-sm mt-2 max-w-md">
              Vetted vets, groomers, cafés and parks — plus, for members, the
              dogs around you looking for playdates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const count =
                f === "All"
                  ? pins.length + dogPins.length
                  : f === "Partners"
                    ? pins.filter((p) => p.type === "partner").length
                    : f === "Events"
                      ? pins.filter((p) => p.type === "event").length
                      : dogPins.length;
              const disabled = f === "Dogs" && !user;
              return (
                <button
                  key={f}
                  onClick={() => !disabled && setFilter(f)}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.18em] transition border ${
                    filter === f
                      ? "bg-terracotta text-cream border-terracotta"
                      : "bg-transparent text-cream border-cream/20 hover:border-terracotta"
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {f} · {count}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {!user && !authLoading && (
        <div className="bg-terracotta-soft text-espresso text-center text-sm py-3 px-6">
          <Link to="/login" className="font-medium hover:underline">
            Sign in
          </Link>{" "}
          to see other dogs nearby and invite them to play.
        </div>
      )}

      <section className="relative isolate z-0">
        <Suspense
          fallback={
            <div className="h-[70vh] flex items-center justify-center bg-cream">
              <p className="text-espresso/60 italic font-serif">
                Loading the map…
              </p>
            </div>
          }
        >
          <MapView
            center={[25.7617, -80.1918]}
            pins={filteredPins}
            dogs={filteredDogs}
            onInviteDog={user ? (d) => setInvitingDog(d) : undefined}
          />
        </Suspense>
        <MapLegend />
      </section>

      {invitingDog && (
        <PlaydateModal
          dog={invitingDog}
          onClose={() => setInvitingDog(null)}
        />
      )}

      <section className="bg-cream py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl text-espresso mb-8">
            {filter === "Dogs" ? "Dogs nearby" : filter}
          </h2>
          {filter !== "Dogs" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPins.map((p) => (
                <div
                  key={`${p.type}-${p.id}`}
                  className="p-6 rounded-2xl border border-espresso/10 bg-white hover:border-terracotta transition"
                >
                  <div className="tracking-brand text-terracotta text-[0.65rem] mb-2">
                    — {p.type === "event" ? "Event" : p.category}
                  </div>
                  <h3 className="font-serif text-xl text-espresso leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-sm text-espresso/70 mt-2">{p.meta}</p>
                  <p className="text-xs text-espresso/50 mt-3">{p.address}</p>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs uppercase tracking-[0.18em] text-terracotta mt-3 inline-block hover:text-espresso"
                    >
                      {p.type === "event" ? "RSVP" : "Visit"} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {(filter === "Dogs" || filter === "All") && dogPins.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {dogPins.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setInvitingDog(d)}
                  className="text-left p-6 rounded-2xl border border-espresso/10 bg-white hover:border-terracotta transition"
                >
                  <div className="tracking-brand text-[#8b6f47] text-[0.65rem] mb-2">
                    — Dog · {d.neighborhood ?? "Miami"}
                  </div>
                  <h3 className="font-serif text-xl text-espresso leading-tight">
                    {d.name}
                  </h3>
                  <p className="text-sm text-espresso/70 mt-2">
                    {[d.breed, d.size, d.age_years ? `${d.age_years}y` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-xs text-espresso/50 mt-3">
                    with {d.owner_display_name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function PlaydateModal({ dog, onClose }: { dog: Dog; onClose: () => void }) {
  const create = useServerFn(createPlaydate);
  const qc = useQueryClient();
  const [parkName, setParkName] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await create({
        data: {
          to_dog_id: dog.id,
          park_name: parkName || undefined,
          proposed_at: proposedAt
            ? new Date(proposedAt).toISOString()
            : undefined,
          message: message || undefined,
        },
      });
      setSent(true);
      qc.invalidateQueries({ queryKey: ["my-playdates"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-espresso/60 z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream max-w-md w-full rounded-2xl p-8"
      >
        {sent ? (
          <div className="text-center">
            <div className="font-serif text-3xl text-espresso">Invite sent ✓</div>
            <p className="text-espresso/60 mt-3 text-sm">
              {dog.owner_display_name} will get back to you in their inbox.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-terracotta text-cream rounded-full px-6 py-2.5 text-xs uppercase tracking-[0.18em]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSend} className="space-y-4">
            <h3 className="font-serif text-2xl text-espresso">
              Invite {dog.name} to play
            </h3>
            <input
              placeholder="Where? e.g. South Pointe Dog Park"
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
            />
            <input
              type="datetime-local"
              value={proposedAt}
              onChange={(e) => setProposedAt(e.target.value)}
              className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
            />
            <textarea
              placeholder="Say hi (optional)"
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-espresso/15 rounded-lg px-4 py-3 text-sm bg-white"
            />
            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-espresso/60 hover:text-espresso"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-terracotta text-cream rounded-full px-6 py-2.5 text-xs uppercase tracking-[0.18em] disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
