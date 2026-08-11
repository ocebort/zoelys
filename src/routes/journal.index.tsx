import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { posts } from "@/lib/journal";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "The Journal — Zoélys" },
      { name: "description", content: "Quiet, considered writing on pet care, sitter craft, and the rituals that keep your companion well." },
      { property: "og:title", content: "The Zoélys Journal" },
      { property: "og:description", content: "Considered reading on pet care, sitter craft and the rituals of trust." },
      { property: "og:image", content: posts[0]?.image },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const [featured, ...rest] = posts;
  return (
    <SiteLayout>
      {/* HEADER */}
      <section className="bg-cream pt-16 pb-12 px-6">
        <div className="mx-auto max-w-6xl text-center">
          <div className="tracking-brand text-terracotta">— The Journal</div>
          <h1 className="font-serif text-5xl md:text-6xl text-espresso mt-4">
            Quiet reading. <span className="italic-serif">Considered care.</span>
          </h1>
          <p className="mt-6 text-espresso/70 max-w-xl mx-auto leading-relaxed">
            Notes from our team and our partner vets — on the rituals, decisions and small attentions that keep pets well.
          </p>
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl">
            <Link
              to="/journal/$slug"
              params={{ slug: featured.slug }}
              className="group grid md:grid-cols-12 gap-8 items-center bg-card rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition"
            >
              <div className="md:col-span-7 aspect-[4/3] md:aspect-auto md:h-full overflow-hidden">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
              </div>
              <div className="md:col-span-5 p-8 md:p-12">
                <div className="tracking-brand text-terracotta">— Featured · {featured.category}</div>
                <h2 className="font-serif text-3xl md:text-4xl text-espresso mt-3 leading-tight">
                  {featured.title}
                </h2>
                <p className="mt-4 text-espresso/75 leading-relaxed">{featured.excerpt}</p>
                <div className="mt-6 text-xs uppercase tracking-[0.18em] text-espresso/60">
                  {featured.author} · {featured.date} · {featured.readTime}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-terracotta">
                  Read the piece <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* GRID */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="border-t border-espresso/10 pt-12 mb-10 flex items-baseline justify-between">
            <h3 className="font-serif text-2xl text-espresso">More from the Journal</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-espresso/50">{posts.length} pieces</span>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {rest.map((p) => (
              <Link
                key={p.slug}
                to="/journal/$slug"
                params={{ slug: p.slug }}
                className="group block"
              >
                <div className="aspect-[5/3] overflow-hidden rounded-xl mb-5">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                  />
                </div>
                <div className="tracking-brand text-terracotta mb-2">— {p.category}</div>
                <h4 className="font-serif text-2xl text-espresso group-hover:text-terracotta transition leading-tight">
                  {p.title}
                </h4>
                <p className="mt-3 text-espresso/70 leading-relaxed">{p.excerpt}</p>
                <div className="mt-4 text-xs uppercase tracking-[0.18em] text-espresso/50">
                  {p.author} · {p.readTime}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
