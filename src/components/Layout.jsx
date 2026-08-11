import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Activity } from "lucide-react";

export default function Layout() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    base44.auth.me().then((u) => setRole(u?.role || "user")).catch(() => setRole("user"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-lg">🏀</span>
            <span className="text-sm font-semibold tracking-[0.28em] text-slate-200">HIGHLIGHT LAB</span>
          </Link>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Link to="/system-health">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Activity className="mr-2 h-4 w-4" /> System health
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}