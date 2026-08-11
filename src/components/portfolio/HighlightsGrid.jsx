import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ClipPlayer from "@/components/ClipPlayer";
import GlassCard from "@/components/glass/GlassCard";
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
    <GlassCard hover className="group relative overflow-hidden !p-0">
      <div onClick={onPlay} className="aspect-video">
        <ClipPlayer clip={clip} source={
          clip.source_type === "youtube" || clip.source_type === "veo"
            ? { source_type: clip.source_type, external_id: clip.external_id }
            : { source_type: "file", file_url: clip.clip_url }
        } />
      </div>
      <span className="pointer-events-none absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground opacity-0 shadow-glow transition group-hover:opacity-100">
        <Play className="h-5 w-5" />
      </span>
      <div className="border-t border-white/10 p-4">
        <p className="font-heading text-sm font-semibold text-foreground">{clip.description || clip.play_type || meta.label}</p>
        <p className="mt-1 label-xs text-foreground/50">Segment {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}</p>
      </div>
    </GlassCard>
  );
}

export default function HighlightsGrid({ clips, tapes, projectId }) {
  const byCat = (key) => clips.filter((c) => c.category === key);
  const hasAny = clips.length > 0;

  return (
    <div>
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <h2 className="display-xl text-5xl sm:text-7xl">Highlights.</h2>
        <span className="label-xs text-foreground/50">{clips.length} clip(s) · {tapes.length} tape(s)</span>
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
                  {tape && <span className="label-xs text-foreground/50">· {tape.clip_count} clips</span>}
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
        <GlassCard variant="tint" className="mt-8 p-10 text-center sm:p-16">
          <p className="display-xl text-5xl sm:text-7xl">No</p>
          <p className="display-xl text-5xl sm:text-7xl">highlights</p>
          <p className="display-xl text-5xl text-primary sm:text-7xl">yet.</p>
        </GlassCard>
      )}
    </div>
  );
}