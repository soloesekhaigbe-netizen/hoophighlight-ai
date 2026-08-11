import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { LogOut, Menu, X, LayoutDashboard, Activity } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Layout() {
  const [role, setRole] = useState(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then((u) => setRole(u?.role || "user")).catch(() => setRole("user"));
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const items = [...NAV, ...(role === "admin" ? [{ to: "/system-health", label: "System health", icon: Activity }] : [])];

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden text-slate-400 hover:text-white md:inline-flex"
              onClick={() => base44.auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
            <button type="button" aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 md:hidden"
              onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-xs border-l border-white/10 bg-slate-950 p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200"
                onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 space-y-1">
              {items.map((n) => {
                const active = location.pathname === n.to;
                return (
                  <Link key={n.to} to={n.to}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3.5 text-sm font-medium transition ${active ? "bg-orange-500/15 text-orange-300" : "text-slate-200 hover:bg-white/5"}`}>
                    <n.icon className="h-5 w-5" /> {n.label}
                  </Link>
                );
              })}
            </nav>
            <Button variant="outline" className="mt-8 w-full border-white/15 bg-transparent text-slate-200 hover:bg-white/10"
              onClick={() => base44.auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}