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
  const meta = catMeta(clip.category);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] transition hover:border-orange-500/30">
      <div onClick={onPlay}>
        <ClipPlayer clip={clip} source={
          clip.source_type === "youtube" || clip.source_type === "veo"
            ? { source_type: clip.source_type, external_id: clip.external_id }
            : { source_type: "file", file_url: clip.clip_url }
        } />
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-slate-100">{clip.description || clip.play_type || meta.label}</p>
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
      <h2 className="text-[11px] tracking-[0.3em] text-orange-400">HIGHLIGHTS</h2>
      <p className="mt-2 text-sm text-slate-400">
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
                <h3 className="text-sm font-semibold tracking-[0.18em] text-slate-200">{c.label}</h3>
                {tape && <span className="text-xs text-slate-500">· {tape.clip_count} clips</span>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((clip) => <HighlightClip key={clip.id} clip={{ ...clip, project_id: projectId }} />)}
              </div>
            </div>
          );
        })}
        {!hasAny && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Play className="h-5 w-5" />
            </span>
            <p className="text-sm text-slate-400">Highlights will appear here once the player publishes clips.</p>
          </div>
        )}
      </div>
    </section>
  );
}