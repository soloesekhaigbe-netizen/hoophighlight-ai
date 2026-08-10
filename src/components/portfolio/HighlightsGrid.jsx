import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ClipPlayer from "@/components/ClipPlayer";
import { CATEGORIES, catMeta, fmtTime } from "@/lib/categories";
import { Play } from "lucide-react";

function HighlightClip({ clip }) {
  const [tracked, setTracked] = useState(false);
  const onPlay = () => {
    if (tracked) return;
    setTracked(true);
    base44.functions.invoke("trackPortfolioEvent", { project_id: clip.project_id, event_type: "highlight_play", category: clip.category }).catch(() => {});
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div onClick={onPlay}>
        <ClipPlayer clip={clip} source={{ source_type: "file", file_url: clip.clip_url }} />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-slate-800">{clip.description || clip.play_type || catMeta(clip.category).label}</p>
        <p className="mt-0.5 text-xs text-slate-500">Segment {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}</p>
      </div>
    </div>
  );
}

export default function HighlightsGrid({ clips, tapes, projectId }) {
  const byCat = (key) => clips.filter((c) => c.category === key);
  const hasAny = clips.length > 0;

  return (
    <section>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Highlights</h2>
      <p className="mt-1 text-sm text-slate-500">
        {tapes.length} tape(s) · {clips.length} clip(s){hasAny ? "" : " — no published highlights yet"}
      </p>

      <div className="mt-6 space-y-8">
        {CATEGORIES.map((c) => {
          const list = byCat(c.key);
          if (!list.length) return null;
          const tape = tapes.find((t) => t.category === c.key);
          return (
            <div key={c.key}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{c.emoji}</span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{c.label}</h3>
                {tape && <span className="text-xs text-slate-400">· {tape.clip_count} clips</span>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((clip) => <HighlightClip key={clip.id} clip={{ ...clip, project_id: projectId }} />)}
              </div>
            </div>
          );
        })}
        {!hasAny && (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-slate-400">
            <Play className="h-5 w-5" /> Highlights will appear here once the player publishes clips.
          </div>
        )}
      </div>
    </section>
  );
}