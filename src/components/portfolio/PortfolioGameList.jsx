import { Calendar } from "lucide-react";

export default function PortfolioGameList({ games }) {
  if (!games?.length) return null;
  return (
    <section>
      <h2 className="text-[11px] tracking-[0.3em] text-orange-400">GAMES</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {games.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition hover:border-orange-500/30">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">{g.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{g.opponent ? `vs ${g.opponent}` : "Scrimmage / fixture"}</p>
            </div>
            {g.game_date && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-orange-400" /> {new Date(g.game_date).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}