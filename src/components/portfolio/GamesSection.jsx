export default function GamesSection({ games }) {
  return (
    <section>
      <h2 className="text-[11px] tracking-[0.3em] text-orange-400">GAMES</h2>
      <div className="mt-5 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
        {games.map((g) => (
          <div key={g.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium">{g.name}</p>
              <p className="text-xs text-slate-500">{g.opponent ? `vs ${g.opponent}` : ""}</p>
            </div>
            {g.game_date && <span className="text-xs text-slate-500">{new Date(g.game_date).toLocaleDateString()}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}