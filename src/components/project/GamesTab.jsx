import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCw, Trash2, AlertTriangle, Info, ChevronRight, Film } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import AddGameDialog from "@/components/project/AddGameDialog";
import CreateReelDialog from "@/components/project/CreateReelDialog";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { fmtTime } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

export default function GamesTab({ project, games, sources, clips, tapes, reload }) {
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const retry = async (source) => {
    await base44.entities.VideoSource.update(source.id, { status: "queued", progress: 0, error_message: "" });
    reload();
    await base44.functions.invoke("analyzeVideoSource", { video_source_id: source.id });
    reload();
  };

  const removeGame = async (game) => {
    if (!window.confirm(`Delete "${game.name}" and all its clips? This cannot be undone.`)) return;
    setDeletingId(game.id);
    try {
      const gs = sources.filter((s) => s.game_id === game.id);
      const sourceIds = gs.map((s) => s.id);
      const gameClips = clips.filter((c) => sourceIds.includes(c.video_source_id));
      const deletedClipIds = gameClips.map((c) => c.id);

      // Bulk delete clips + sources (no N+1).
      if (deletedClipIds.length) await base44.entities.Clip.deleteMany({ video_source_id: { $in: sourceIds } });
      if (sourceIds.length) await base44.entities.VideoSource.deleteMany({ game_id: game.id });
      await base44.entities.Game.delete(game.id);

      // Clean dangling reel references + recompute counts/duration.
      for (const tape of tapes) {
        const ids = tape.clip_ids || [];
        if (!ids.some((id) => deletedClipIds.includes(id))) continue;
        const remaining = ids.filter((id) => !deletedClipIds.includes(id));
        const remainingClips = clips.filter((c) => remaining.includes(c.id) && c.game_id !== game.id);
        const dur = remainingClips.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
        await base44.entities.HighlightTape.update(tape.id, {
          clip_ids: remaining, clip_count: remaining.length, duration_seconds: dur,
        });
      }

      toast({ title: "Game deleted", description: `${gameClips.length} clips removed. Reels updated.` });
      reload();
    } catch (e) {
      toast({ title: "Could not delete game", description: e?.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <AddGameDialog projectId={project.id} onDone={reload}
          trigger={<Button className="bg-orange-500 font-semibold tracking-[0.18em] text-slate-950 hover:bg-orange-400"><Plus className="mr-2 h-4 w-4" />ADD GAME</Button>} />
      </div>

      {games.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center">
          <Film className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-4 font-heading text-lg">No games yet</p>
          <p className="mt-1 text-sm text-slate-400">Upload footage or add a Veo/YouTube link — automatic analysis will find your highlights.</p>
          <AddGameDialog projectId={project.id} onDone={reload}
            trigger={<Button className="mt-5 bg-orange-500 font-semibold tracking-[0.18em] text-slate-950 hover:bg-orange-400"><Plus className="mr-2 h-4 w-4" />UPLOAD GAME</Button>} />
        </div>
      )}

      {games.map((game) => {
        const gs = sources.filter((s) => s.game_id === game.id);
        const gameClips = clips.filter((c) => c.game_id === game.id);
        const accepted = gameClips.filter((c) => c.status === "accepted");
        const highlightDur = accepted.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
        const processing = gs.some((s) => !["ready", "error"].includes(s.status));

        return (
          <div key={game.id} className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition hover:border-white/15">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button onClick={() => navigate(`/project/${project.id}/game/${game.id}`)}
                className="group min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-lg font-semibold group-hover:text-orange-400">{game.name}</p>
                  <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:text-orange-400" />
                </div>
                <p className="text-xs text-slate-500">
                  {[game.opponent && `vs ${game.opponent}`, game.game_date, game.competition && game.competition].filter(Boolean).join(" · ") || "No details"}
                </p>
              </button>
              <div className="flex items-center gap-1">
                {accepted.length > 0 && (
                  <CreateReelDialog project={project} games={games} clips={clips} reload={reload} presetGameIds={[game.id]}
                    trigger={<Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Reel</Button>} />
                )}
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-400" disabled={deletingId === game.id} onClick={() => removeGame(game)}>
                  {deletingId === game.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/5 text-center">
              <div className="bg-white/[0.03] px-3 py-3">
                <p className="font-display text-2xl">{gameClips.length}</p>
                <p className="text-[10px] tracking-[0.2em] text-slate-500">CLIPS</p>
              </div>
              <div className="bg-white/[0.03] px-3 py-3">
                <p className="font-display text-2xl">{gs.length}</p>
                <p className="text-[10px] tracking-[0.2em] text-slate-500">RECORDING{gs.length !== 1 ? "S" : ""}</p>
              </div>
              <div className="bg-white/[0.03] px-3 py-3">
                <p className="font-display text-2xl">{fmtTime(highlightDur)}</p>
                <p className="text-[10px] tracking-[0.2em] text-slate-500">HIGHLIGHTS</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {gs.map((s) => (
                <div key={s.id} className="rounded-2xl bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.title || s.url}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        {s.source_type} · {clips.filter((c) => c.video_source_id === s.id).length} clips
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      {(s.status === "error" || (s.source_type !== "file" && s.status === "ready" && (s.clips_detected || 0) === 0)) && (
                        <Button size="sm" variant="outline" className="border-white/15 bg-transparent" onClick={() => retry(s)}>
                          <RotateCw className="mr-2 h-3.5 w-3.5" /> Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  {processing && (
                    <Progress value={s.progress || 5} className="mt-3 h-1.5 bg-white/10" />
                  )}
                  {s.status === "error" && s.error_message && (
                    <p className="mt-3 flex gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0" />{s.error_message}
                    </p>
                  )}
                  {s.source_type !== "file" && s.status === "ready" && (s.clips_detected || 0) === 0 && (
                    <p className="mt-3 flex gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs text-sky-200">
                      <Info className="h-4 w-4 shrink-0" />
                      Automatic detection isn't available for this link — YouTube doesn't serve video frames to the server for it. Open the game workspace to mark clips manually, or upload the video file for automatic detection.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}