import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Monogram } from "@/components/Logo";
import { X } from "lucide-react";

// Full-screen editorial navigation overlay. Huge stacked links on ink black.
export default function FullScreenMenu({ items, onClose, footer, actions }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-ink text-paper animate-fade-in">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Monogram tone="sun" className="h-10 w-10" />
          <button type="button" aria-label="Close menu" onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-paper transition hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center px-6 sm:px-10">
          <ul className="animate-stagger">
            {items.map((n, i) => (
              <li key={n.to} className="border-b border-white/10">
                <Link to={n.to} onClick={onClose} className="group flex items-baseline gap-4 py-3 sm:gap-6 sm:py-4">
                  <span className="font-heading text-xs text-sun/70 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display-xl text-4xl transition-colors group-hover:text-sun sm:text-6xl md:text-7xl">
                    {n.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {footer && (
          <div className="px-6 pb-8 sm:px-10">
            <p className="font-display text-xl uppercase tracking-wide text-paper/70 sm:text-2xl">{footer}</p>
          </div>
        )}

        {actions?.length > 0 && (
          <div className="flex flex-wrap gap-3 px-6 pb-10 sm:px-10">
            {actions.map((a) => (
              <button key={a.label} type="button" onClick={() => { a.onClick?.(); onClose(); }}
                className="label-sm rounded-full border border-white/20 px-5 py-2.5 text-paper transition hover:bg-sun hover:text-ink hover:border-sun">
                {a.icon ? <a.icon className="mr-2 inline h-4 w-4" /> : null}{a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}