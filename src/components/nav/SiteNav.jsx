import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Monogram } from "@/components/Logo";
import FullScreenMenu from "@/components/nav/FullScreenMenu";
import { Menu } from "lucide-react";

// Site-wide navigation: fixed vertical rail (md+) with a signature circular
// menu button, and a minimal top bar + circular burger on mobile. The circular
// button opens the full-screen editorial menu.
export default function SiteNav({ items, brandTo = "/", footer, actions }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const Circular = ({ size = "h-14 w-14", onRail = false }) => (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => setOpen(true)}
      className={`group flex ${size} items-center justify-center rounded-full bg-sun text-ink shadow-[0_4px_20px_rgba(247,201,72,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95 ${onRail ? "ring-2 ring-ink/10" : ""}`}
    >
      <Menu className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
    </button>
  );

  return (
    <>
      {/* Desktop / tablet vertical rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center justify-between border-r border-white/10 bg-ink py-5 md:flex">
        <Link to={brandTo} aria-label="Prospect home" className="mt-1">
          <Monogram tone="sun" className="h-10 w-10" />
        </Link>

        <nav className="flex flex-col items-center gap-1.5">
          {items.slice(0, 3).map((n) => {
            const active = location.pathname === n.to || (n.to !== "/dashboard" && location.pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} aria-label={n.label}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${active ? "bg-sun text-ink" : "text-paper/55 hover:bg-white/10 hover:text-paper"}`}>
                {n.icon ? <n.icon className="h-5 w-5" /> : null}
              </Link>
            );
          })}
        </nav>

        <Circular onRail />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 md:hidden">
        <Link to={brandTo} aria-label="Prospect home">
          <Monogram tone="sun" className="h-9 w-9" />
        </Link>
        <span className="font-display text-sm uppercase tracking-[0.2em] text-paper">Prospect</span>
        <Circular size="h-11 w-11" />
      </header>

      {open && <FullScreenMenu items={items} onClose={() => setOpen(false)} footer={footer} actions={actions} />}
    </>
  );
}