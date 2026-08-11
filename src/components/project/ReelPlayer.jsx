import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";
import SharePortfolioButton from "@/components/SharePortfolioButton";
import ClipPlayer from "@/components/ClipPlayer";
import { fmtTime } from "@/lib/categories";

export default function ReelPlayer({ open, onOpenChange, tape, clips, sources, games, project }) {
  const [index, setIndex] = useState(-1);
  const tapeClips = (tape?.clip_ids || []).map((id) => clips.find((c) => c.id === id)).filter(Boolean);
  const inc = tape?.include_fields || {};
  const hasIntro = inc.intro !== false && !!tape?.intro_text;
  const hasOutro = inc.outro !== false && !!tape?.outro_text;

  useEffect(() => { if (open) setIndex(hasIntro ? -1 : 0); }, [open, hasIntro]);

  useEffect(() => {
    if (!open) return undefined;
    if (index === -1) { const t = setTimeout(() => setIndex(0), 4000); return () => clearTimeout(t); }
    const clip = tapeClips[index];
    if (!clip) return undefined;
    const dur = Math.max(2, (clip.end_seconds || 0) - (clip.start_seconds || 0)) * 1000 + 800;
    const t = setTimeout(() => setIndex((i) => i + 1), dur);
    return () => clearTimeout(t);
  }, [index, open, tapeClips]);

  const clip = index >= 0 ? tapeClips[index] : null;
  const source = clip ? sources.find((s) => s.id === clip.video_source_id) : null;
  const game = clip ? games.find((g) => g.id === clip.game_id) : null;
  const showLabels = inc.clip_labels !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-slate-950 p-0 text-slate-100">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-orange-400">✨ HIGHLIGHT REEL</p>
              <h3 className="mt-1 font-heading text-2xl font-semibold">{tape?.version_label || tape?.title || project?.player_name}</h3>
            </div>
            <SharePortfolioButton project={project} tone="light" label="Share" />
          </div>

          <div className="mt-5">
            {index === -1 ? (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-center">
                <p className="font-heading text-3xl font-bold uppercase tracking-[0.12em] sm:text-4xl">{tape?.intro_text || project?.player_name}</p>
                <p className="mt-3 text-xs tracking-[0.3em] text-slate-400">{project?.season || "2026"} HIGHLIGHTS</p>
              </div>
            ) : clip ? (
              <ClipPlayer clip={clip} source={source} autoplay onEnded={() => setIndex((i) => i + 1)} />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-900 text-center">
                <p className="font-heading text-3xl font-semibold">{tape?.outro_text || project?.player_name}</p>
                <p className="mt-2 text-xs tracking-[0.28em] text-slate-500">END OF REEL</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              {clip
                ? `${index + 1} / ${tapeClips.length}${showLabels ? ` · ${game?.name || "Game"} · ${clip.play_type || clip.description || clip.category}` : ""} · ${fmtTime(clip.start_seconds)}`
                : index === -1 ? "Intro" : "Outro"}
            </span>
            <Button size="sm" variant="ghost" className="text-slate-300" onClick={() => setIndex((i) => i + 1)}>
              <SkipForward className="mr-1.5 h-3.5 w-3.5" /> Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}