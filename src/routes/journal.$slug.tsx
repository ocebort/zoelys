import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPost, posts } from "@/lib/journal";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/journal/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Article — Zoélys" }] };
    return {
      meta: [
        { title: `${p.title} — Zoélys Journal` },
        { name: "description", content: p.excerpt },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt },
        { property: "og:image", content: p.image },
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="py-32 text-center px-6">
        <h1 className="font-serif text-4xl text-espresso">Piece not found</h1>
        <Link to="/journal" className="btn-outline mt-6 inline-flex text-espresso">
          Back to the Journal
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ reset }) => (
    <SiteLayout>
      <div className="py-32 text-center px-6">
        <h1 className="font-serif text-3xl text-espresso">This piece didn't load</h1>
        <button onClick={reset} className="btn-terra mt-6">Try again</button>
      </div>
    </SiteLayout>
  ),
  component: PostPage,
});

function PostPage() {
  const { post } = Route.useLoaderData();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <SiteLayout>
      <article>
        {/* HERO */}
        <header className="relative h-[60vh] min-h-[420px] overflow-hidden">
          <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/30 via-espresso/40 to-espresso/85" />
          <div className="relative h-full flex items-end">
            <div className="mx-auto max-w-3xl w-full px-6 pb-12 text-cream">
              <Link to="/journal" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cream/80 hover:text-terracotta-soft mb-6">
                <ArrowLeft className="w-3.5 h-3.5" /> The Journal
              </Link>
              <div className="tracking-brand text-terracotta-soft">— {post.category}</div>
              <h1 className="font-serif text-4xl md:text-6xl mt-3 leading-[1.05]">{post.title}</h1>
              <div className="mt-6 text-xs uppercase tracking-[0.2em] text-cream/80">
                {post.author} · {post.date} · {post.readTime}
              </div>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="px-6 py-20 bg-cream">
          <div className="mx-auto max-w-2xl">
            <p className="font-serif italic text-2xl text-espresso/85 leading-snug border-l-2 border-terracotta pl-6 mb-12">
              {post.excerpt}
            </p>
            <div className="space-y-7 text-espresso/85 text-[1.075rem] leading-[1.85]">
              {post.body.map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-16 pt-10 border-t border-espresso/10 flex items-center justify-between">
              <div className="text-sm text-espresso/60">Written by {post.author}</div>
              <Link to="/journal" className="text-xs uppercase tracking-[0.2em] text-terracotta hover:text-espresso inline-flex items-center gap-2">
                More pieces <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="bg-sand/40 py-20 px-6">
            <div className="mx-auto max-w-5xl">
              <div className="tracking-brand text-terracotta mb-3">— Keep reading</div>
              <h3 className="font-serif text-3xl text-espresso mb-10">From the same shelf</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {related.map((p) => (
                  <Link key={p.slug} to="/journal/$slug" params={{ slug: p.slug }} className="group block">
                    <div className="aspect-[5/3] overflow-hidden rounded-xl mb-4">
                      <img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
                    </div>
                    <div className="tracking-brand text-terracotta mb-2">— {p.category}</div>
                    <h4 className="font-serif text-xl text-espresso group-hover:text-terracotta transition">{p.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </SiteLayout>
  );
}
