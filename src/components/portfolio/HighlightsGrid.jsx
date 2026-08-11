import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ClipPlayer from "@/components/ClipPlayer";
import { CATEGORIES, catMeta, fmtTime } from "@/lib/categories";
import { Play } from "lucide-react";

function HighlightClip({ clip, large = false }) {
  const [tracked, setTracked] = useState(false);
  const onPlay = () => {
    if (tracked) return;
    setTracked(true);
    base44.functions.invoke("trackPortfolioEvent", { project_id: clip.project_id, event_type: "highlight_play", category: clip.category }).catch(() => {});
  };
  const meta = catMeta(clip.category);
  return (
    <div className="group relative overflow-hidden border-2 border-ink transition hover:border-flame">
      <div onClick={onPlay} className={large ? "aspect-video" : "aspect-video"}>
        <ClipPlayer clip={clip} source={
          clip.source_type === "youtube" || clip.source_type === "veo"
            ? { source_type: clip.source_type, external_id: clip.external_id }
            : { source_type: "file", file_url: clip.clip_url }
        } />
      </div>
      <span className="pointer-events-none absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-sun text-ink opacity-0 transition group-hover:opacity-100">
        <Play className="h-5 w-5" />
      </span>
      <div className="border-t-2 border-ink bg-paper p-4">
        <p className="font-heading text-sm font-semibold text-ink">{clip.description || clip.play_type || meta.label}</p>
        <p className="mt-1 label-xs text-ink/50">Segment {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}</p>
      </div>
    </div>
  );
}

export default function HighlightsGrid({ clips, tapes, projectId }) {
  const byCat = (key) => clips.filter((c) => c.category === key);
  const hasAny = clips.length > 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b-2 border-ink pb-4">
        <h2 className="display-xl text-5xl sm:text-7xl">Highlights.</h2>
        <span className="label-xs text-ink/50">{clips.length} clip(s) · {tapes.length} tape(s)</span>
      </div>

      {hasAny ? (
        <div className="mt-8 space-y-12">
          {CATEGORIES.map((c) => {
            const list = byCat(c.key);
            if (!list.length) return null;
            const tape = tapes.find((t) => t.category === c.key);
            return (
              <div key={c.key}>
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-2xl">{c.emoji}</span>
                  <h3 className="font-display text-3xl uppercase">{c.label}</h3>
                  {tape && <span className="label-xs text-ink/50">· {tape.clip_count} clips</span>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {list.map((clip, i) => (
                    <div key={clip.id} className={i === 0 ? "sm:col-span-2" : ""}>
                      <HighlightClip clip={{ ...clip, project_id: projectId }} large={i === 0} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 border-2 border-ink p-10 text-center sm:p-16">
          <p className="display-xl text-5xl sm:text-7xl">No</p>
          <p className="display-xl text-5xl sm:text-7xl">highlights</p>
          <p className="display-xl text-5xl text-flame sm:text-7xl">yet.</p>
        </div>
      )}
    </div>
  );
}