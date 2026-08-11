import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PawPrint, Phone, FileText, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Zoélys" },
      { name: "description", content: "Our 5-step vetting process, the meet-and-greet, and what to expect during your sitting." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { t: "Application", d: "Detailed profile, experience, references and a complete home setup review." },
  { t: "Background check", d: "Full identity verification and criminal record check — no exceptions." },
  { t: "Zoélys interview", d: "A personal video interview assessing values, empathy and fit with our standards." },
  { t: "Trial period", d: "Monitored first sittings with continuous ratings review." },
  { t: "Certified badge awarded", d: "Only those who pass every stage earn the Zoélys Certified badge." },
];

const sittingFeatures = [
  { Icon: FileText, t: "Structured pet profile", d: "A full briefing sent to your sitter before day one — every critical detail flagged by priority." },
  { Icon: PawPrint, t: "Live updates on demand", d: "Photos and videos at the frequency you choose, not your sitter." },
  { Icon: Phone, t: "Partner vet on standby", d: "A trusted vet is one call away if anything goes wrong." },
  { Icon: MessageCircle, t: "Post-sitting report", d: "A full summary, so you come home informed — not anxious." },
];

function HowItWorks() {
  return (
    <SiteLayout>
      <section className="bg-navy text-cream py-28 px-6 text-center">
        <div className="text-xs tracking-brand text-gold">THE ZOÉLYS STANDARD</div>
        <h1 className="font-serif text-5xl md:text-6xl mt-4">How it works</h1>
        <div className="gold-rule" />
        <p className="mt-6 text-slate-muted max-w-2xl mx-auto">
          Two principles guide every decision: rigorous vetting, and a personal introduction before any pet is ever entrusted.
        </p>
      </section>

      {/* VETTING */}
      <section className="py-28 px-6 bg-cream">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <div className="text-xs tracking-brand text-gold">THE VETTING PROCESS</div>
            <h2 className="font-serif text-4xl text-navy mt-4">Five stages. One badge.</h2>
            <div className="gold-rule" />
          </div>
          <ol className="relative border-l-2 border-gold/40 ml-4 space-y-12">
            {steps.map((s, i) => (
              <li key={s.t} className="pl-10 relative">
                <div className="absolute -left-[1.1rem] top-0 w-9 h-9 rounded-full bg-navy text-gold font-serif flex items-center justify-center text-sm shadow-md">
                  {i + 1}
                </div>
                <h3 className="font-serif text-2xl text-navy">{s.t}</h3>
                <p className="mt-2 text-ink/70 leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MEET & GREET */}
      <section className="py-28 px-6 bg-white">
        <div className="mx-auto max-w-4xl text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gold flex items-center justify-center mb-6">
            <PawPrint className="w-9 h-9 text-navy" />
          </div>
          <div className="text-xs tracking-brand text-gold">THE MEET-AND-GREET</div>
          <h2 className="font-serif text-4xl text-navy mt-4">No booking until your pet approves</h2>
          <div className="gold-rule" />
          <p className="mt-6 text-ink/70 leading-relaxed max-w-2xl mx-auto">
            Before any booking is confirmed, the sitter meets your pet in person. Once complete, they earn a
            <span className="text-navy font-medium"> Zoélys Verified Meet</span> badge for that pet.
          </p>
          <p className="mt-6 font-serif italic text-xl text-navy">
            "This is what makes Zoélys different. No booking is confirmed until your pet approves."
          </p>
        </div>
      </section>

      {/* DURING THE SITTING */}
      <section className="py-28 px-6 bg-cream">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="text-xs tracking-brand text-gold">DURING THE SITTING</div>
            <h2 className="font-serif text-4xl text-navy mt-4">Four premium features</h2>
            <div className="gold-rule" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {sittingFeatures.map(({ Icon, t, d }) => (
              <div key={t} className="card-soft p-10 flex gap-6">
                <div className="shrink-0 w-14 h-14 rounded-full bg-navy flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-navy mb-2">{t}</h3>
                  <p className="text-sm text-ink/70 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link to="/get-matched" className="btn-navy">Find the Perfect Sitter for My Pet →</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
