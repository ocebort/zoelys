import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-espresso text-cream/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="font-serif text-4xl text-cream tracking-[0.2em]">ZOÉLYS</div>
          <div className="h-px w-24 bg-terracotta my-6" />
          <p className="text-sm text-cream/70 max-w-sm leading-relaxed italic-serif text-lg">
            "Pets aren't a side note — they're family. We treat them that way."
          </p>
        </div>

        <div className="md:col-span-2">
          <h4 className="tracking-brand text-terracotta mb-5">Explore</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/get-matched" className="hover:text-terracotta">Find a Sitter</Link></li>
            <li><Link to="/map" className="hover:text-terracotta">The Map</Link></li>
            <li><Link to="/events" className="hover:text-terracotta">Events</Link></li>
            <li><Link to="/partners" className="hover:text-terracotta">Partners</Link></li>
            <li><Link to="/journal" className="hover:text-terracotta">Journal</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="tracking-brand text-terracotta mb-5">Zoélys</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/how-it-works" className="hover:text-terracotta">How It Works</Link></li>
            <li><Link to="/join" className="hover:text-terracotta">Join</Link></li>
            <li><Link to="/login" className="hover:text-terracotta">Sign In</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="tracking-brand text-terracotta mb-5">Stay close</h4>
          <p className="text-sm text-cream/70 mb-4">Quiet letters, real care. No spam, ever.</p>
          <form className="flex gap-2">
            <input type="email" placeholder="your@email.com" className="flex-1 bg-transparent border border-cream/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-terracotta" />
            <button className="bg-terracotta text-cream rounded-full px-4 py-2 text-xs uppercase tracking-widest">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/50">© 2026 Zoélys. Crafted with care in Miami.</p>
          <div className="flex items-center gap-5 text-cream/70">
            <a href="#" aria-label="Instagram" className="hover:text-terracotta"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="hover:text-terracotta text-xs uppercase tracking-widest">TikTok</a>
            <a href="#" className="hover:text-terracotta text-xs uppercase tracking-widest">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
