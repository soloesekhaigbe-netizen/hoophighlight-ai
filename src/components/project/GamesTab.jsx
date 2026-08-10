import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCw, Trash2, AlertTriangle, Info } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import AddGameDialog from "@/components/project/AddGameDialog";
import { Plus } from "lucide-react";

export default function GamesTab({ project, games, sources, clips, reload }) {
  const retry = async (source) => {
    if (source.source_type !== "file") {
      await base44.entities.VideoSource.update(source.id, { status: "ready", progress: 100, error_message: "" });
      reload();
      return;
    }
    await base44.entities.VideoSource.update(source.id, { status: "queued", progress: 0, error_message: "" });
    reload();
    await base44.functions.invoke("analyzeVideoSource", { video_source_id: source.id });
    reload();
  };

  const removeGame = async (game) => {
    const gs = sources.filter((s) => s.game_id === game.id);
    for (const s of gs) {
      const cs = clips.filter((c) => c.video_source_id === s.id);
      for (const c of cs) await base44.entities.Clip.delete(c.id);
      await base44.entities.VideoSource.delete(s.id);
    }
    await base44.entities.Game.delete(game.id);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <AddGameDialog projectId={project.id} onDone={reload}
          trigger={<Button className="bg-orange-500 font-semibold tracking-[0.18em] text-slate-950 hover:bg-orange-400"><Plus className="mr-2 h-4 w-4" />ADD GAME</Button>} />
      </div>

      {games.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center text-sm text-slate-400">
          No games yet. Upload footage for automatic AI analysis, or add a Veo/YouTube link for manual clip marking.
        </div>
      )}

      {games.map((game) => {
        const gs = sources.filter((s) => s.game_id === game.id);
        return (
          <div key={game.id} className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-semibold">{game.name}</p>
                <p className="text-xs text-slate-500">
                  {[game.opponent && `vs ${game.opponent}`, game.game_date].filter(Boolean).join(" · ") || "No details"}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-400" onClick={() => removeGame(game)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-3">
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
                      {s.status === "error" && (
                        <Button size="sm" variant="outline" className="border-white/15 bg-transparent" onClick={() => retry(s)}>
                          <RotateCw className="mr-2 h-3.5 w-3.5" /> Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  {s.status !== "ready" && s.status !== "error" && (
                    <Progress value={s.progress || 5} className="mt-3 h-1.5 bg-white/10" />
                  )}
                  {s.error_message && (
                    <p className="mt-3 flex gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0" />{s.error_message}
                    </p>
                  )}
                  {s.source_type !== "file" && s.status === "ready" && (
                    <p className="mt-3 flex gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs text-sky-200">
                      <Info className="h-4 w-4 shrink-0" />Link mode — auto-analysis isn't available. Add clips manually by marking start/end timestamps.
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