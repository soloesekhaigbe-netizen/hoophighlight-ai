import { CATEGORIES } from "@/lib/categories";

export default function AnalyticsTab({ events, clips }) {
  const views = events.filter((e) => e.event_type === "portfolio_view").length;
  const plays = events.filter((e) => e.event_type === "highlight_play").length;
  const contacts = events.filter((e) => e.event_type === "coach_contact").length;
  const byCategory = CATEGORIES.map((c) => ({
    c, count: events.filter((e) => e.event_type === "highlight_play" && e.category === c.key).length,
  }));
  const maxCat = Math.max(1, ...byCategory.map((x) => x.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[["PORTFOLIO VIEWS", views], ["HIGHLIGHT PLAYS", plays], ["COACH CONTACTS", contacts]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <p className="text-3xl font-semibold text-orange-400">{v}</p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-500">{l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
        <p className="text-[11px] tracking-[0.24em] text-slate-500">PLAYS BY CATEGORY</p>
        <div className="mt-5 space-y-4">
          {byCategory.map(({ c, count }) => (
            <div key={c.key} className="flex items-center gap-4">
              <span className={`w-20 text-[11px] tracking-[0.18em] ${c.accent}`}>{c.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${c.bg.replace("/10", "/60")}`} style={{ width: `${(count / maxCat) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-sm font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {clips.filter((c) => c.status === "accepted").length} accepted clips published across {CATEGORIES.length} categories.
      </p>
    </div>
  );
}