import { CATEGORIES } from "@/lib/categories";

// "By the numbers" — season totals rail (left) + fixture list (right).
export default function PortfolioNumbers({ clips, games }) {
  const rows = [
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, emoji: c.emoji, count: clips.filter((x) => x.category === c.key).length })),
    { key: "games", label: "GAMES", emoji: "📅", count: games.length },
    { key: "total", label: "TOTAL HIGHLIGHTS", emoji: "🎬", count: clips.length },
  ];

  return (
    <section id="stats" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <h2 className="display-xl text-4xl sm:text-6xl">By the numbers.</h2>
        <span className="label-xs text-foreground/50">Season totals</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass squircle-lg divide-y divide-white/10">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-4 px-6 py-5">
              <span className="label-sm text-foreground/65">
                {r.emoji ? `${r.emoji} ` : ""}
                {r.label}
              </span>
              <span className="font-display text-4xl leading-none text-primary">{r.count}</span>
            </div>
          ))}
        </div>

        <div className="glass squircle-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <span className="label-sm text-foreground/65">Games</span>
            <span className="label-xs text-foreground/45">{games.length} fixture(s)</span>
          </div>
          {games.length ? (
            <ul className="divide-y divide-white/10">
              {games.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-semibold">{g.name}</p>
                    <p className="text-xs text-foreground/55">{g.opponent ? `vs ${g.opponent}` : "Fixture"}</p>
                  </div>
                  {g.game_date && (
                    <span className="label-xs whitespace-nowrap text-foreground/50">
                      {new Date(g.game_date).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-foreground/50">No fixtures yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}