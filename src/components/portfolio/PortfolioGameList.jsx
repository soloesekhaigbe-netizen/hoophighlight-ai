import { Calendar } from "lucide-react";

// Editorial fixture archive. Large dates, opponents, alternating rows.
export default function PortfolioGameList({ games }) {
  if (!games?.length) {
    return (
      <div>
        <h2 className="display-xl text-5xl sm:text-7xl">Games.</h2>
        <div className="mt-8 border-2 border-white/15 p-10 text-center sm:p-16">
          <p className="display-xl text-5xl sm:text-7xl">No</p>
          <p className="display-xl text-5xl sm:text-7xl">fixtures</p>
          <p className="display-xl text-5xl text-flame sm:text-7xl">yet.</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b-2 border-white/10 pb-4">
        <h2 className="display-xl text-5xl sm:text-7xl">Games.</h2>
        <span className="label-xs text-paper/50">{games.length} fixture(s)</span>
      </div>

      <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
        {games.map((g, i) => {
          const d = g.game_date ? new Date(g.game_date) : null;
          return (
            <li key={g.id} className={`grid items-center gap-3 py-6 sm:grid-cols-12 ${i % 2 ? "bg-white/[0.03]" : ""}`}>
              <div className="flex items-baseline gap-4 sm:col-span-3">
                {d && (
                  <div className="leading-none">
                    <p className="font-display text-4xl sm:text-5xl">{String(d.getDate()).padStart(2, "0")}</p>
                    <p className="label-xs text-paper/60">{d.toLocaleDateString(undefined, { month: "short" })} {d.getFullYear()}</p>
                  </div>
                )}
              </div>
              <div className="sm:col-span-7">
                <p className="font-display text-2xl uppercase sm:text-3xl">{g.name}</p>
                <p className="mt-1 text-sm text-paper/70">{g.opponent ? `vs ${g.opponent}` : "Scrimmage / fixture"}</p>
              </div>
              <div className="sm:col-span-2 sm:justify-self-end">
                <span className="label-xs inline-flex items-center gap-1.5 text-paper/60">
                  <Calendar className="h-3.5 w-3.5" /> Fixture
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}