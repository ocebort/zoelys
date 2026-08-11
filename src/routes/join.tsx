import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { Check, PawPrint, Heart } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Zoélys" },
      { name: "description", content: "Two paths into the Zoélys world — owners and sitters." },
    ],
  }),
  component: Join,
});

type Path = null | "owner" | "sitter";

const tiers = [
  { name: "Gold", price: "€55", credits: 5, best: "Occasional — 1 home visit / month" },
  { name: "Platinum", price: "€100", credits: 10, best: "Regular — 1 overnight / month", featured: true },
  { name: "Diamond", price: "€150", credits: 15, best: "Frequent — 1 overnight + 1 visit / month" },
];

function Join() {
  const [path, setPath] = useState<Path>(null);
  const [sitterSubmitted, setSitterSubmitted] = useState(false);

  if (!path) {
    return (
      <SiteLayout>
        <section className="bg-navy text-cream py-24 px-6 text-center">
          <div className="text-xs tracking-brand text-gold">JOIN ZOÉLYS</div>
          <h1 className="font-serif text-5xl md:text-6xl mt-4">Choose your path</h1>
          <div className="gold-rule" />
        </section>
        <section className="py-24 px-6">
          <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-8">
            <button onClick={() => setPath("owner")} className="card-soft p-12 text-left group">
              <Heart className="w-9 h-9 text-gold mb-5" />
              <h2 className="font-serif text-2xl text-navy mb-2">I am looking for a sitter for my pet</h2>
              <p className="text-sm text-ink/70">Create your owner account, build your pet's profile, and unlock concierge matching.</p>
              <span className="inline-block mt-6 text-gold group-hover:translate-x-1 transition">Continue as Owner →</span>
            </button>
            <button onClick={() => setPath("sitter")} className="card-soft p-12 text-left group">
              <PawPrint className="w-9 h-9 text-gold mb-5" />
              <h2 className="font-serif text-2xl text-navy mb-2">I want to become a Zoélys sitter</h2>
              <p className="text-sm text-ink/70">Apply to our 5-step vetting process. Only those who pass every stage earn the Certified badge.</p>
              <span className="inline-block mt-6 text-gold group-hover:translate-x-1 transition">Apply as Sitter →</span>
            </button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (path === "owner") {
    return (
      <SiteLayout>
        <section className="bg-navy text-cream py-20 px-6 text-center">
          <div className="text-xs tracking-brand text-gold">OWNER ONBOARDING</div>
          <h1 className="font-serif text-4xl md:text-5xl mt-4">Welcome to Zoélys</h1>
          <div className="gold-rule" />
        </section>
        <section className="py-16 px-6">
          <div className="mx-auto max-w-3xl card-soft p-10">
            <h2 className="font-serif text-2xl text-navy mb-6">Your account</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <input placeholder="Full name" className="input-elegant" />
              <input placeholder="Email" className="input-elegant" />
              <input type="password" placeholder="Create a password" className="input-elegant" />
              <input placeholder="City" className="input-elegant" />
              <input placeholder="Pet's name" className="input-elegant" />
              <input placeholder="Pet species & breed" className="input-elegant" />
            </div>
          </div>

          <div className="mx-auto max-w-5xl mt-16">
            <div className="text-center mb-3">
              <div className="text-xs tracking-brand text-gold">SUBSCRIPTION</div>
              <h2 className="font-serif text-3xl text-navy mt-3">Choose your tier</h2>
              <div className="gold-rule" />
              <p className="text-sm text-ink/65 italic max-w-xl mx-auto">
                Every pet on Zoélys receives the same premium standard of care. Your subscription unlocks the platform — not a better sitter.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              {tiers.map((t) => (
                <div key={t.name} className={`card-soft p-8 relative ${t.featured ? "border-2 border-gold shadow-gold" : ""}`}>
                  {t.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-brand bg-gold text-navy px-3 py-1 rounded-full">MOST CHOSEN</div>}
                  <h3 className="font-serif text-2xl text-navy">{t.name}</h3>
                  <div className="font-serif text-4xl text-gold mt-3">{t.price}<span className="text-sm text-ink/60 font-sans">/month</span></div>
                  <div className="mt-1 text-sm text-ink/70">{t.credits} credits</div>
                  <p className="text-xs text-ink/60 mt-5 italic">{t.best}</p>
                  <button className="btn-navy w-full justify-center mt-8 !py-3">Select {t.name} →</button>
                </div>
              ))}
            </div>

            <div className="card-soft p-8 mt-10">
              <h3 className="font-serif text-lg text-navy mb-4">Credit values</h3>
              <ul className="text-sm text-ink/75 grid md:grid-cols-2 gap-2">
                <li>Home visit (1h) — <span className="text-navy font-medium">5 credits</span></li>
                <li>Dog walking (1h) — <span className="text-navy font-medium">5 credits</span></li>
                <li>Day care (up to 8h) — <span className="text-navy font-medium">8 credits</span></li>
                <li>Overnight stay (24h) — <span className="text-navy font-medium">10 credits</span></li>
                <li>Extended overnight (48h) — <span className="text-navy font-medium">15 credits</span></li>
                <li>Top-up — <span className="text-navy font-medium">€10 per additional credit</span></li>
              </ul>
              <p className="text-xs italic text-ink/60 mt-5">Pricing shared upon confirmation of your match.</p>
            </div>

            <div className="text-center mt-10">
              <Link to="/get-matched" className="btn-gold">Continue to Intake →</Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (sitterSubmitted) {
    return (
      <SiteLayout>
        <section className="min-h-[80vh] flex items-center justify-center px-6 bg-navy text-cream">
          <div className="max-w-xl text-center">
            <div className="w-20 h-20 rounded-full bg-gold mx-auto flex items-center justify-center mb-8"><Check className="w-10 h-10 text-navy" /></div>
            <h1 className="font-serif text-4xl">Thank you for applying.</h1>
            <div className="gold-rule" />
            <p className="text-slate-muted mt-6 leading-relaxed">
              Our team will review your application and contact you within 48 hours.
            </p>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-20 px-6 text-center">
        <div className="text-xs tracking-brand text-gold">SITTER APPLICATION</div>
        <h1 className="font-serif text-4xl md:text-5xl mt-4">Apply to become a Zoélys sitter</h1>
        <div className="gold-rule" />
        <p className="text-slate-muted max-w-xl mx-auto">
          All applicants go through our 5-step vetting process. We respond within 48 hours.
        </p>
      </section>
      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl card-soft p-10 space-y-5">
          <input placeholder="Full name" className="input-elegant" />
          <input placeholder="Email" className="input-elegant" />
          <input placeholder="City" className="input-elegant" />
          <input placeholder="Years of experience with animals" className="input-elegant" />
          <textarea placeholder="Describe your home setup (outdoor space, other pets, lifestyle)" className="input-elegant min-h-28" />
          <textarea placeholder="Your availability (days, times, recurring patterns)" className="input-elegant min-h-24" />
          <textarea placeholder="Why do you want to join Zoélys?" className="input-elegant min-h-28" />
          <button onClick={() => setSitterSubmitted(true)} className="btn-gold w-full justify-center">Send My Application →</button>
        </div>
      </section>
    </SiteLayout>
  );
}
