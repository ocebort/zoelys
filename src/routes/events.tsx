import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Zoélys" },
      { name: "description", content: "Curated experiences for you and your pet." },
    ],
  }),
  component: Events,
});

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: "Dog" | "Cat" | "All Animals";
  setting: "Outdoor" | "Indoor";
  partner?: string;
  desc: string;
};

const events: Event[] = [
  { id: "1", title: "Morning 5K with Your Golden", date: "Sat, June 6", time: "06:30 – 08:30", location: "Brickell Bay Drive, Miami", category: "Dog", setting: "Outdoor", desc: "A sunrise run along the bay — dogs welcome. Hydration stations and a Zoélys breakfast at the finish line." },
  { id: "2", title: "Urban Dog Socialisation Workshop", date: "Sun, June 14", time: "10:00 – 12:00", location: "Wynwood Studio, Miami", category: "Dog", setting: "Indoor", desc: "A small-group workshop led by a certified behaviourist. For dogs who could benefit from structured introductions." },
  { id: "3", title: "Zoélys × Vet Partner Health Check Day", date: "Sat, June 20", time: "09:00 – 16:00", location: "Coral Gables Veterinary", category: "All Animals", setting: "Indoor", partner: "Coral Gables Veterinary", desc: "Complimentary full health checks for Zoélys members. By appointment only." },
  { id: "4", title: "Pet-Friendly Brunch", date: "Sun, June 28", time: "11:00 – 14:00", location: "The Garden House, Coconut Grove", category: "All Animals", setting: "Outdoor", partner: "The Garden House", desc: "A reserved garden section for Zoélys members and their companions. Curated tasting menu, water bowls service." },
];

const filters = ["All", "Dog", "Cat", "All Animals", "Outdoor", "Indoor", "Partner Events"] as const;

function Events() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = events.filter((e) => {
    if (filter === "All") return true;
    if (filter === "Partner Events") return !!e.partner;
    if (filter === "Outdoor" || filter === "Indoor") return e.setting === filter;
    return e.category === filter;
  });

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-24 px-6 text-center">
        <div className="text-xs tracking-brand text-gold">CURATED EXPERIENCES</div>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">Zoélys Events</h1>
        <div className="gold-rule" />
        <p className="text-slate-muted">Curated experiences for you and your pet.</p>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm transition border ${
                  filter === f
                    ? "bg-gold text-navy border-gold"
                    : "bg-transparent text-navy border-navy/15 hover:border-gold"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-center text-ink/60 italic">Your events will appear here once your journey with Zoélys begins.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {visible.map((e) => (
                <article key={e.id} className="card-soft overflow-hidden">
                  <div className="h-52 bg-gradient-to-br from-navy to-navy-soft relative flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-gold/50" />
                    {e.partner && (
                      <div className="absolute top-4 left-4 text-[10px] tracking-brand bg-gold text-navy px-3 py-1 rounded-full">
                        IN PARTNERSHIP WITH {e.partner.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 text-xs text-gold tracking-brand mb-3">
                      <span>{e.category.toUpperCase()}</span>
                      <span className="opacity-40">•</span>
                      <span>{e.setting.toUpperCase()}</span>
                    </div>
                    <h3 className="font-serif text-2xl text-navy">{e.title}</h3>
                    <p className="text-sm text-ink/70 mt-3 leading-relaxed">{e.desc}</p>
                    <div className="mt-5 flex flex-col gap-1.5 text-sm text-ink/80">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" /> {e.date} · {e.time}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold" /> {e.location}</div>
                    </div>
                    <div className="mt-7 flex items-center justify-between">
                      <a className="text-sm text-navy hover:text-gold transition">Learn More →</a>
                      <button className="btn-gold !py-2.5 !px-5 text-sm">Reserve →</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
