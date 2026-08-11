import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners — Zoélys" },
      { name: "description", content: "Every partner is personally selected by the Zoélys team." },
    ],
  }),
  component: Partners,
});

type Partner = {
  id: string;
  name: string;
  category: "Vets & Health" | "Grooming" | "Training & Behaviour" | "Nutrition" | "Pet-Friendly Venues" | "Other";
  desc: string;
  location: string;
};

const partners: Partner[] = [
  { id: "1", name: "Coral Gables Veterinary", category: "Vets & Health", desc: "Full-service clinic specialising in preventive care and exotic animals.", location: "Coral Gables, Miami" },
  { id: "2", name: "Maison Pelage", category: "Grooming", desc: "Salon-style grooming with hand-mixed coat treatments.", location: "Wynwood, Miami" },
  { id: "3", name: "Calm Paws Behaviour Studio", category: "Training & Behaviour", desc: "Force-free behavioural training led by certified specialists.", location: "Brickell, Miami" },
  { id: "4", name: "Maison Verte Pet Nutrition", category: "Nutrition", desc: "Tailored raw and gently-cooked diets delivered fresh.", location: "Doral, Miami" },
  { id: "5", name: "The Garden House", category: "Pet-Friendly Venues", desc: "Garden restaurant with a reserved Zoélys section.", location: "Coconut Grove, Miami" },
  { id: "6", name: "Bayside Animal Hospital", category: "Vets & Health", desc: "24/7 emergency partner for all Zoélys members.", location: "Miami Beach" },
];

const cats = ["All", "Vets & Health", "Grooming", "Training & Behaviour", "Nutrition", "Pet-Friendly Venues", "Other"] as const;

function Partners() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const list = cat === "All" ? partners : partners.filter((p) => p.category === cat);

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-24 px-6 text-center">
        <div className="text-xs tracking-brand text-gold">A CURATED CIRCLE</div>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">Our Partners</h1>
        <div className="gold-rule" />
        <p className="text-slate-muted">Every partner is personally selected by the Zoélys team.</p>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-5 py-2 rounded-full text-sm transition border ${
                  cat === c ? "bg-gold text-navy border-gold" : "bg-transparent text-navy border-navy/15 hover:border-gold"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((p) => (
              <article key={p.id} className="card-soft p-8 relative">
                <div className="absolute top-5 right-5 flex items-center gap-1 text-[10px] tracking-brand bg-navy text-gold px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> ZOÉLYS APPROVED
                </div>
                <div className="w-14 h-14 rounded-xl bg-navy flex items-center justify-center mb-5 font-serif text-gold text-xl">
                  {p.name.charAt(0)}
                </div>
                <div className="text-xs tracking-brand text-gold mb-2">{p.category.toUpperCase()}</div>
                <h3 className="font-serif text-xl text-navy">{p.name}</h3>
                <p className="text-sm text-ink/70 mt-2 leading-relaxed">{p.desc}</p>
                <div className="flex items-center gap-2 text-sm text-ink/70 mt-4">
                  <MapPin className="w-4 h-4 text-gold" /> {p.location}
                </div>
                <button className="mt-6 text-sm text-navy hover:text-gold transition">Discover →</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
