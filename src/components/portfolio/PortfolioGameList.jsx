import { Calendar } from "lucide-react";

export default function PortfolioGameList({ games }) {
  if (!games?.length) return null;
  return (
    <section>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Games</h2>
      <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {games.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{g.name}</p>
              <p className="text-xs text-slate-500">{g.opponent ? `vs ${g.opponent}` : "Scrimmage / fixture"}</p>
            </div>
            {g.game_date && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" /> {g.game_date}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}