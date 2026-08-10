import { useMemo } from "react";
import { Eye, Play, MousePointerClick, Mail } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

const BAR_BG = { buckets: "bg-orange-500", rebounds: "bg-sky-500", blocks: "bg-emerald-500", shooting: "bg-fuchsia-500" };

export default function AnalyticsTab({ events = [] }) {
  const counts = useMemo(() => {
    const c = { portfolio_view: 0, highlight_play: 0, link_click: 0, coach_contact: 0 };
    for (const e of events) if (c[e.event_type] !== undefined) c[e.event_type]++;
    return c;
  }, [events]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const e of events) if (e.event_type === "highlight_play" && e.category) map[e.category] = (map[e.category] || 0) + 1;
    return map;
  }, [events]);

  const tiles = [
    ["Portfolio views", counts.portfolio_view, Eye, "text-sky-400"],
    ["Highlight plays", counts.highlight_play, Play, "text-orange-400"],
    ["Link clicks", counts.link_click, MousePointerClick, "text-fuchsia-400"],
    ["Coach contacts", counts.coach_contact, Mail, "text-emerald-400"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="font-heading text-xl font-semibold">Recruiting analytics</p>
        <p className="mt-1 text-sm text-slate-400">How coaches are engaging with your portfolio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value, Icon, cls]) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <Icon className={`h-5 w-5 ${cls}`} />
            <p className="mt-4 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-[11px] tracking-[0.2em] text-slate-500">{label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <p className="text-[11px] tracking-[0.24em] text-slate-500">HIGHLIGHT PLAYS BY CATEGORY</p>
        <div className="mt-4 space-y-3">
          {CATEGORIES.map((c) => {
            const n = byCategory[c.key] || 0;
            const max = Math.max(1, ...Object.values(byCategory));
            return (
              <div key={c.key} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-400">{c.emoji} {c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${BAR_BG[c.key]}`} style={{ width: `${(n / max) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-semibold">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}