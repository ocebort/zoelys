import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, LogOut, Dog, Calendar, Settings, ChevronDown, MapPin, CalendarDays, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const publicLinks = [
  { to: "/get-matched", label: "Find a Sitter" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/journal", label: "Journal" },
] as const;

const exploreLinks = [
  { to: "/map", label: "Map", icon: MapPin, desc: "Vetted pet spots near you" },
  { to: "/events", label: "Events", icon: CalendarDays, desc: "Meetups & adoption days" },
  { to: "/partners", label: "Partners", icon: Store, desc: "Cafés, vets, groomers" },
] as const;

const memberLinks = [
  { to: "/dogs", label: "My Dogs", icon: Dog },
  { to: "/playdates", label: "Playdates", icon: Calendar },
] as const;


export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const solid = !transparent || scrolled;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const initial =
    user?.user_metadata?.full_name?.[0] ??
    user?.user_metadata?.name?.[0] ??
    user?.email?.[0]?.toUpperCase() ??
    "·";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-cream/90 backdrop-blur-md border-b border-espresso/10 text-espresso"
          : "bg-transparent text-cream"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link to="/" className="font-serif text-2xl tracking-[0.2em]">
          ZOÉLYS
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[0.78rem] uppercase tracking-[0.18em] hover:text-terracotta transition"
              activeProps={{ className: "text-terracotta" }}
            >
              {l.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="text-[0.78rem] uppercase tracking-[0.18em] hover:text-terracotta transition flex items-center gap-1 outline-none">
              Explore <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-64 bg-cream border-espresso/10 text-espresso"
            >
              {exploreLinks.map((l) => (
                <DropdownMenuItem key={l.to} asChild>
                  <Link to={l.to} className="cursor-pointer flex items-start gap-3 py-2">
                    <l.icon className="h-4 w-4 mt-0.5 text-terracotta" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{l.label}</span>
                      <span className="text-xs text-espresso/60">{l.desc}</span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>


        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full bg-terracotta text-cream w-10 h-10 justify-center font-serif text-sm hover:bg-terracotta/90 transition"
                  aria-label="Account menu"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-cream border-espresso/10 text-espresso"
              >
                <DropdownMenuLabel className="font-serif text-base truncate">
                  {user.user_metadata?.full_name ?? user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-espresso/10" />
                {memberLinks.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link
                      to={l.to}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <l.icon className="h-4 w-4" /> {l.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-espresso/10" />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin/import"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="h-4 w-4" /> Admin · Import
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-espresso/10" />
                <DropdownMenuItem
                  onSelect={signOut}
                  className="cursor-pointer text-espresso/80 focus:text-espresso"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[0.78rem] uppercase tracking-[0.18em] hover:text-terracotta transition"
              >
                Sign In
              </Link>
              <Link to="/join" className="btn-terra !py-2.5 !px-5">
                Join Zoélys
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden"
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-cream text-espresso border-t border-espresso/10">
          <div className="px-6 py-6 flex flex-col gap-5">
            {publicLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.18em]"
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-espresso/10 my-1" />
            <div className="tracking-brand text-terracotta text-[0.65rem]">
              — Explore
            </div>
            {exploreLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.18em] flex items-center gap-2"
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="h-px bg-espresso/10 my-1" />
                <div className="tracking-brand text-terracotta text-[0.65rem]">
                  — Account
                </div>
                {memberLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="text-sm uppercase tracking-[0.18em] flex items-center gap-2"
                  >
                    <l.icon className="h-4 w-4" /> {l.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin/import"
                    onClick={() => setOpen(false)}
                    className="text-sm uppercase tracking-[0.18em] flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" /> Admin · Import
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="text-sm uppercase tracking-[0.18em] text-left flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/join"
                onClick={() => setOpen(false)}
                className="btn-terra w-fit mt-2"
              >
                Join Zoélys
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

