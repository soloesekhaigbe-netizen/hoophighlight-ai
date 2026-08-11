import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

const NAV = [
  { label: "Overview", href: "#overview" },
  { label: "Highlights", href: "#highlights" },
  { label: "Games", href: "#games" },
  { label: "Contact", href: "#contact" },
];

// Slim public header for the portfolio page. Mirrors the app's dashboard header
// (logo + brand, dark background, subtle bottom border) but exposes NO account
// or dashboard controls. A burger menu on mobile/tablet opens a dark dropdown
// with smooth-scroll navigation to the public portfolio sections only.
export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const go = (e, href) => {
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => go(e, n.href)}
              className="text-xs font-medium tracking-[0.18em] text-slate-400 transition hover:text-white"
            >
              {n.label.toUpperCase()}
            </a>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div
          className="absolute right-4 top-14 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={(e) => go(e, n.href)}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {n.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}