import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SkipForward } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import { catMeta, fmtTime } from "@/lib/categories";

export default function TapePreview({ open, onOpenChange, project, category, clips, sources, games }) {
  const [index, setIndex] = useState(-1); // -1 = intro, clips.length = outro
  const meta = catMeta(category);

  useEffect(() => { if (open) setIndex(project?.intro_enabled ? -1 : 0); }, [open, project]);

  useEffect(() => {
    if (!open) return undefined;
    if (index === -1) {
      const t = setTimeout(() => setIndex(0), 4000);
      return () => clearTimeout(t);
    }
    const clip = clips[index];
    if (!clip) return undefined;
    const dur = Math.max(2, (clip.end_seconds || 0) - (clip.start_seconds || 0)) * 1000 + 800;
    const t = setTimeout(() => setIndex((i) => i + 1), dur);
    return () => clearTimeout(t);
  }, [index, open, clips]);

  const clip = index >= 0 ? clips[index] : null;
  const source = clip ? sources.find((s) => s.id === clip.video_source_id) : null;
  const game = clip ? games.find((g) => g.id === clip.game_id) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-white/10 bg-slate-950 p-0 text-slate-100">
        <div className="p-6">
          <p className={`text-[11px] tracking-[0.3em] ${meta.accent}`}>{meta.emoji} {meta.label} TAPE</p>
          <h3 className="mt-1 font-heading text-2xl font-semibold">{project.player_name}</h3>

          <div className="mt-5">
            {index === -1 ? (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-center">
                <p className="font-heading text-4xl font-bold uppercase tracking-[0.14em]">{project.player_name}</p>
                <p className="mt-3 text-sm tracking-[0.3em] text-slate-400">
                  {[project.height, project.position && project.position.toUpperCase()].filter(Boolean).join(" ")}
                </p>
                <p className={`mt-1 text-sm tracking-[0.3em] ${meta.accent}`}>
                  {[project.season, meta.label].filter(Boolean).join(" ")} HIGHLIGHTS
                </p>
                {project.team_name && <p className="mt-4 text-xs tracking-[0.24em] text-slate-500">{project.team_name}{project.jersey_number ? ` · #${project.jersey_number}` : ""}</p>}
              </div>
            ) : clip ? (
              <ClipPlayer source={source} start={clip.start_seconds} end={clip.end_seconds} autoplay />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-900 text-center">
                <p className="font-heading text-3xl font-semibold">{project.outro_text || project.player_name}</p>
                <p className="mt-2 text-xs tracking-[0.28em] text-slate-500">END OF TAPE</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              {clip ? `${index + 1} / ${clips.length} · ${game?.name || "Game"} · ${fmtTime(clip.start_seconds)}` : index === -1 ? "Intro" : "Outro"}
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