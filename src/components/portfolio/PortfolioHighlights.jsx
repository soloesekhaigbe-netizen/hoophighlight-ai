import { useState } from "react";
import { base44 } from "@/api/base44Client";
import ClipPlayer from "@/components/ClipPlayer";
import GlassCard from "@/components/glass/GlassCard";
import { catMeta, fmtTime } from "@/lib/categories";

function HighlightClip({ clip, projectId }) {
  const [tracked, setTracked] = useState(false);
  const onPlay = () => {
    if (tracked) return;
    setTracked(true);
    base44.functions
      .invoke("trackPortfolioEvent", { project_id: projectId, event_type: "highlight_play", category: clip.category })
      .catch(() => {});
  };
  const meta = catMeta(clip.category);
  return (
    <GlassCard hover className="group overflow-hidden !p-0">
      <div onClick={onPlay} className="aspect-video">
        <ClipPlayer
          clip={clip}
          source={
            clip.source_type === "youtube" || clip.source_type === "veo"
              ? { source_type: clip.source_type, external_id: clip.external_id }
              : { source_type: "file", file_url: clip.clip_url }
          }
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`label-xs ${meta.accent}`}>{meta.label}</span>
          <span className="label-xs text-foreground/45">
            Segment {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}
          </span>
        </div>
        <p className="mt-2 font-heading text-sm font-semibold text-foreground">
          {clip.description || clip.play_type || meta.label}
        </p>
      </div>
    </GlassCard>
  );
}

export default function PortfolioHighlights({ clips, tapes, projectId }) {
  return (
    <section id="highlights" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <h2 className="display-xl text-4xl sm:text-6xl">Highlights.</h2>
        <span className="label-xs text-foreground/50">{clips.length} clip(s) · {tapes.length} tape(s)</span>
      </div>

      {clips.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {clips.map((c) => (
            <HighlightClip key={c.id} clip={{ ...c, project_id: projectId }} projectId={projectId} />
          ))}
        </div>
      ) : (
        <GlassCard variant="tint" className="mt-6 p-10 text-center sm:p-16">
          <p className="display-xl text-4xl sm:text-6xl">No highlights yet.</p>
          <p className="mt-3 text-sm text-foreground/60">Check back soon — clips appear here once they're published.</p>
        </GlassCard>
      )}
    </section>
  );
}