import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ShieldCheck, PawPrint, Sparkles, HeartHandshake, MapPin, Calendar, Store, ArrowUpRight, Quote } from "lucide-react";
import heroVideo from "@/assets/hero-pets.mp4.asset.json";
import pet1 from "@/assets/pet-1.jpg";
import pet2 from "@/assets/pet-2.jpg";
import pet3 from "@/assets/pet-3.jpg";
import pet4 from "@/assets/pet-4.jpg";
import pet5 from "@/assets/pet-5.jpg";
import { posts as journalPosts } from "@/lib/journal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zoélys — Premium Pet Care, Redefined" },
      { name: "description", content: "Submit your request. We handpick your perfect sitter. You hear from us within 24 hours." },
      { property: "og:image", content: pet3 },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <SiteLayout>
      {/* HERO — full-bleed video */}
      <section className="relative h-[calc(100svh-5rem)] min-h-[560px] w-full overflow-hidden text-cream">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={heroVideo.url}
          autoPlay
          muted
          loop
          playsInline
          poster={pet3}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/65 via-espresso/55 to-espresso/95" />

        <div className="relative h-full flex flex-col">
          <div className="flex-1 flex items-center">
            <div className="mx-auto max-w-6xl w-full px-6 lg:px-10 pt-24">
              <div className="max-w-3xl">
                <div className="tracking-brand text-terracotta-soft mb-6">— Concierge pet care</div>
                <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] text-cream text-shadow-soft">
                  Your pet,
                  <br />
                  <span className="italic-serif text-sand">cared for like family.</span>
                </h1>
                <p className="mt-8 text-lg md:text-xl text-cream max-w-xl leading-relaxed font-normal text-shadow-soft">
                  Tell us about your companion. We handpick the perfect sitter within 24 hours — no scrolling, no guessing.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link to="/get-matched" className="btn-terra text-sm">
                    Find a Sitter <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link to="/how-it-works" className="btn-outline border border-cream text-cream hover:!bg-cream hover:!text-espresso">
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* INTRO STRIP */}
      <section className="bg-cream py-20 px-6 border-b border-espresso/10">
        <div className="mx-auto max-w-4xl text-center">
          <Quote className="w-8 h-8 text-terracotta mx-auto mb-6" />
          <p className="font-serif text-2xl md:text-4xl text-espresso leading-snug">
            "Zoélys is the platform built for the moment you walk out the door — and the peace of mind you deserve until you walk back in."
          </p>
        </div>
      </section>

      {/* STORY / HOW IT WORKS — alternating */}
      <section className="bg-sand/40 py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeader eyebrow="The journey" title="How Zoélys works" />
          <div className="mt-16 space-y-6 md:space-y-4">
            {[
              { n: "01", t: "Tell us about your pet", d: "A detailed care brief — habits, quirks, fears, the things only you know.", img: pet2 },
              { n: "02", t: "We find your match", d: "Our team hand-picks the perfect sitter within 24 hours. One proposal, not ten.", img: pet4 },
              { n: "03", t: "Meet, approve, relax", d: "An in-person meet-and-greet earns the Verified Meet badge. Then breathe.", img: pet1 },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`grid md:grid-cols-12 gap-6 md:gap-10 items-center ${
                  i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="md:col-span-5">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                    <img src={s.img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
                <div className="md:col-span-7 md:px-6">
                  <div className="font-serif text-7xl text-terracotta/40">{s.n}</div>
                  <h3 className="font-serif text-3xl md:text-4xl text-espresso mt-2">{s.t}</h3>
                  <p className="mt-4 text-espresso/70 max-w-md leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* JOURNAL TEASER */}
      <section className="bg-cream py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <div className="tracking-brand text-terracotta">— The Journal</div>
              <h2 className="font-serif text-4xl md:text-5xl text-espresso mt-3">Quiet reading on care.</h2>
            </div>
            <Link to="/journal" className="text-xs uppercase tracking-[0.2em] text-espresso hover:text-terracotta inline-flex items-center gap-2">
              All pieces <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {journalPosts.slice(0, 3).map((p) => (
              <Link key={p.slug} to="/journal/$slug" params={{ slug: p.slug }} className="group block">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-5">
                  <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                </div>
                <div className="tracking-brand text-terracotta mb-2">— {p.category}</div>
                <h3 className="font-serif text-xl text-espresso group-hover:text-terracotta transition leading-tight">{p.title}</h3>
                <p className="mt-2 text-sm text-espresso/70 leading-relaxed">{p.excerpt}</p>
                <div className="mt-3 text-[0.7rem] uppercase tracking-[0.2em] text-espresso/50">{p.readTime}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img src={pet5} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-espresso/75" />
        <div className="relative mx-auto max-w-3xl text-center text-cream">
          <div className="tracking-brand text-terracotta-soft mb-6">Ready when you are</div>
          <h2 className="font-serif text-5xl md:text-6xl">Find their perfect match.</h2>
          <p className="mt-6 text-cream/80 max-w-xl mx-auto">
            It takes three minutes. We take it from there.
          </p>
          <Link to="/get-matched" className="btn-terra mt-10 inline-flex">
            Begin <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-cream normal-case tracking-normal">{n}</div>
      <div className="mt-1">{label}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, dark }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <div className={`tracking-brand ${dark ? "text-terracotta-soft" : "text-terracotta"}`}>— {eyebrow}</div>
      <h2 className={`font-serif text-4xl md:text-5xl mt-4 ${dark ? "text-cream" : "text-espresso"}`}>
        {title}
      </h2>
    </div>
  );
}

function BentoTile({
  className,
  img,
  eyebrow,
  title,
  body,
  cta,
  variant,
}: {
  className?: string;
  img: string;
  eyebrow?: string;
  title: string;
  body?: string;
  cta?: { to: string; label: string };
  variant?: "overlay";
}) {
  return (
    <div className={`bento-tile group ${className ?? ""}`}>
      <img src={img} alt="" className="bento-img transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      <div className="bento-overlay" />
      <div className="relative h-full flex flex-col justify-end p-6 md:p-8 text-cream">
        {eyebrow && <div className="tracking-brand text-terracotta-soft mb-2">{eyebrow}</div>}
        <h3 className={`font-serif ${variant === "overlay" ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} leading-tight`}>
          {title}
        </h3>
        {body && <p className="mt-3 text-cream/85 max-w-md text-sm md:text-base leading-relaxed">{body}</p>}
        {cta && (
          <Link to={cta.to} className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-terracotta-soft hover:text-cream">
            {cta.label} <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function BentoCard({
  className,
  icon: Icon,
  title,
  body,
}: {
  className?: string;
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className={`bento-tile ${className ?? ""} bg-espresso text-cream`}>
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
        <Icon className="w-7 h-7 text-terracotta" />
        <div>
          <h3 className="font-serif text-2xl md:text-3xl">{title}</h3>
          <p className="mt-2 text-cream/70 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function BentoLink({
  className,
  icon: Icon,
  title,
  body,
  to,
}: {
  className?: string;
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  to: "/map" | "/events" | "/partners";
}) {
  return (
    <Link to={to} className={`bento-tile ${className ?? ""} bg-sand/60 hover:bg-terracotta group`}>
      <div className="relative h-full flex items-center gap-5 p-6 md:p-7">
        <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center shrink-0 group-hover:bg-espresso transition">
          <Icon className="w-5 h-5 text-espresso group-hover:text-terracotta transition" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl text-espresso group-hover:text-cream transition truncate">{title}</h3>
          <p className="text-xs text-espresso/70 group-hover:text-cream/80 transition leading-relaxed">{body}</p>
        </div>
        <HeartHandshake className="hidden" />
        <ArrowUpRight className="w-5 h-5 text-espresso/40 group-hover:text-cream transition shrink-0" />
      </div>
    </Link>
  );
}
