import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Monogram } from "@/components/Logo";
import FullScreenMenu from "@/components/nav/FullScreenMenu";
import { Menu } from "lucide-react";

// Floating glass navigation: a detached vertical glass dock (md+) with squircle
// icon buttons and a circular menu trigger; a floating glass top bar on mobile.
export default function SiteNav({ items, brandTo = "/", footer, actions }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (n) => {
    if (n.to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === n.to || (n.to && !n.to.startsWith("#") && location.pathname.startsWith(n.to));
  };

  const MenuButton = ({ size = "h-12 w-12" }) => (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => setOpen(true)}
      className={`group flex ${size} items-center justify-center rounded-full bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground shadow-[0_8px_24px_-8px_rgba(255,90,31,0.7)] transition-transform duration-300 hover:scale-105 active:scale-95`}>
      <Menu className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
    </button>
  );

  return (
    <>
      {/* Desktop / tablet floating dock */}
      <aside className="fixed left-4 top-4 bottom-4 z-30 hidden w-[64px] flex-col items-center justify-between glass-strong squircle py-5 md:flex">
        <Link to={brandTo} aria-label="Prospect home" className="mt-1">
          <Monogram tone="sun" className="h-10 w-10" />
        </Link>

        <nav className="flex flex-col items-center gap-2">
          {items.slice(0, 5).map((n) => {
            const active = isActive(n);
            return (
              <Link key={n.to} to={n.to} aria-label={n.label}
                title={n.label}
                className={`flex h-11 w-11 items-center justify-center rounded-[0.9rem] transition-all duration-200 ${active ? "bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground shadow-[0_6px_20px_-8px_rgba(255,90,31,0.7)]" : "text-foreground/55 hover:bg-white/10 hover:text-foreground"}`}>
                {n.icon ? <n.icon className="h-5 w-5" /> : null}
              </Link>
            );
          })}
        </nav>

        <MenuButton />
      </aside>

      {/* Mobile floating top bar */}
      <header className="fixed left-3 right-3 top-3 z-30 flex items-center justify-between glass-strong squircle px-4 py-2.5 md:hidden">
        <Link to={brandTo} aria-label="Prospect home">
          <Monogram tone="sun" className="h-9 w-9" />
        </Link>
        <span className="font-display text-sm uppercase tracking-[0.2em] text-foreground">Prospect</span>
        <MenuButton size="h-10 w-10" />
      </header>

      {open && <FullScreenMenu items={items} onClose={() => setOpen(false)} footer={footer} actions={actions} />}
    </>
  );
}