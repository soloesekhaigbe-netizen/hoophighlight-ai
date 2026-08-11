import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Pencil, Trash2, Upload, Sparkles, Film } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import ClipCard from "@/components/project/ClipCard";
import CreateReelDialog from "@/components/project/CreateReelDialog";
import StatusBadge from "@/components/StatusBadge";
import GlassCard from "@/components/glass/GlassCard";
import GlassAIPanel from "@/components/glass/GlassAIPanel";
import { fmtTime, ACTIVE_STATUSES } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

export default function GameWorkspace() {
  const { id, gameId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ game: null, sources: [], clips: [], project: null });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [project, games, sources, clips] = await Promise.all([
      base44.entities.Project.get(id),
      base44.entities.Game.filter({ project_id: id }, "-created_date", 500),
      base44.entities.VideoSource.filter({ project_id: id }, "-created_date", 500),
      base44.entities.Clip.filter({ project_id: id }, "-created_date", 500),
    ]);
    const game = games.find((g) => g.id === gameId) || null;
    setState({ project, game, sources: sources.filter((s) => s.game_id === gameId), clips: clips.filter((c) => c.game_id === gameId) });
    setForm(game ? { name: game.name || "", opponent: game.opponent || "", game_date: game.game_date || "", competition: game.competition || "", venue: game.venue || "", team: game.team || "" } : {});
    setLoading(false);
  };

  useEffect(() => { load(); }, [gameId]);
  useEffect(() => {
    const active = state.sources.some((s) => ACTIVE_STATUSES.includes(s.status));
    if (!active) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [state.sources]);

  // Pull-to-refresh — runs before any early return so hooks stay consistent.
  const { pull, refreshing } = usePullToRefresh(load);

  const saveGame = async () => {
    setSaving(true);
    try {
      await base44.entities.Game.update(gameId, form);
      toast({ title: "Game updated" });
      setEditing(false);
      load();
    } catch (e) {
      toast({ title: "Could not save", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const removeGame = async () => {
    if (!window.confirm("Delete this game and all its clips? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const sourceIds = state.sources.map((s) => s.id);
      const deletedClipIds = state.clips.map((c) => c.id);
      if (sourceIds.length) await base44.entities.Clip.deleteMany({ video_source_id: { $in: sourceIds } });
      if (sourceIds.length) await base44.entities.VideoSource.deleteMany({ game_id: gameId });
      await base44.entities.Game.delete(gameId);

      const tapes = await base44.entities.HighlightTape.filter({ project_id: id });
      for (const tape of tapes) {
        const ids = tape.clip_ids || [];
        if (!ids.some((cid) => deletedClipIds.includes(cid))) continue;
        const remaining = ids.filter((cid) => !deletedClipIds.includes(cid));
        await base44.entities.HighlightTape.update(tape.id, { clip_ids: remaining, clip_count: remaining.length });
      }
      navigate(`/project/${id}?tab=games`);
    } catch (e) {
      toast({ title: "Could not delete", description: e?.message, variant: "destructive" });
    } finally { setDeleting(false); }
  };

  const addReplacement = async (file) => {
    if (!file) return;
    setReplacing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("addVideoSource", { project_id: id, game_id: gameId, file_url, title: file.name });
      const created = res?.data?.created || res?.created || [];
      for (const s of created) base44.functions.invoke("analyzeVideoSource", { video_source_id: s.id }).catch(() => {});
      toast({ title: "Replacement footage added", description: "Analysis started." });
      load();
    } catch (e) {
      toast({ title: "Upload failed", description: e?.message, variant: "destructive" });
    } finally { setReplacing(false); }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const { game, sources, clips, project } = state;
  if (!game) return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center text-foreground">
      <p className="font-display text-3xl uppercase">Game not found</p>
      <Link to={`/project/${id}?tab=games`} className="label-sm text-primary">Back to games</Link>
    </div>
  );

  const accepted = clips.filter((c) => c.status === "accepted");
  const highlightDur = accepted.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
  const fullSource = sources.find((s) => s.source_type === "file" && s.file_url) || sources[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PullToRefreshIndicator pull={pull} refreshing={refreshing} />
      <Link to={`/project/${id}?tab=games`} className="label-xs inline-flex items-center gap-2 text-foreground/50 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Games
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.9] sm:text-6xl">{game.name}</h1>
          <p className="mt-3 text-sm text-foreground/55">
            {[game.opponent && `vs ${game.opponent}`, game.game_date, game.competition, game.venue].filter(Boolean).join(" · ") || "No details"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={replacing}>
                {replacing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Replace
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Upload replacement footage</DialogTitle></DialogHeader>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 squircle border border-dashed border-white/15 p-8 hover:border-primary/50">
                <Upload className="h-6 w-6 text-foreground/55" />
                <span className="text-sm text-foreground/70">Choose a video file</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => addReplacement(e.target.files?.[0])} />
              </label>
            </DialogContent>
          </Dialog>
          {accepted.length > 0 && (
            <CreateReelDialog project={project} games={[game]} clips={clips} reload={load} presetGameIds={[gameId]}
              trigger={<Button><Sparkles className="mr-2 h-4 w-4" /> Reel</Button>} />
          )}
          <Button variant="ghost" className="text-foreground/45 hover:text-rose-300" disabled={deleting} onClick={removeGame}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics strip */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          ["CLIPS", clips.length],
          ["RECORDINGS", sources.length],
          ["HIGHLIGHTS", fmtTime(highlightDur)],
        ].map(([l, v]) => (
          <GlassCard key={l} className="px-4 py-4 text-center">
            <p className="font-display text-3xl leading-none">{v}</p>
            <p className="label-xs mt-1.5 text-foreground/45">{l}</p>
          </GlassCard>
        ))}
      </div>

      {/* Full game player */}
      <div className="mt-8">
        <h2 className="label-xs mb-3 text-foreground/50">Full game</h2>
        {fullSource ? (
          fullSource.source_type === "file" && fullSource.file_url ? (
            <ClipPlayer clip={{ clip_url: fullSource.file_url, start_seconds: 0, end_seconds: 0, processing_status: "ready" }} source={{ source_type: "file" }} />
          ) : (
            <ClipPlayer clip={{ clip_url: "", start_seconds: 0, end_seconds: 0, processing_status: "ready" }} source={fullSource} />
          )
        ) : (
          <div className="flex aspect-video items-center justify-center squircle border border-dashed border-white/15 text-foreground/40">
            <Film className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Processing */}
      {sources.some((s) => ACTIVE_STATUSES.includes(s.status)) && (
        <div className="mt-6">
          <GlassAIPanel title="Processing" icon={Sparkles}>
            <div className="space-y-2">
              {sources.filter((s) => ACTIVE_STATUSES.includes(s.status)).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3">
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-foreground/55">{s.title} · {s.progress || 0}%</span>
                </div>
              ))}
            </div>
          </GlassAIPanel>
        </div>
      )}

      {/* Clips */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-3">
          <h2 className="font-display text-2xl uppercase">Clips</h2>
          <span className="label-xs text-foreground/40">{clips.length}</span>
        </div>
        {clips.length === 0 ? (
          <GlassCard className="mt-4 border border-dashed border-white/15 p-10 text-center text-sm text-foreground/40">
            No clips for this game yet. {sources.some((s) => ACTIVE_STATUSES.includes(s.status)) ? "Analysis is running." : "Add clips manually from the Clips tab."}
          </GlassCard>
        ) : (
          <div className="mt-5 space-y-4">
            {clips.map((c) => (
              <ClipCard key={c.id} clip={c} project={project} source={sources.find((s) => s.id === c.video_source_id)} game={game} reload={load} />
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit game</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs text-foreground/55">Game name</Label>
              <Input className="mt-1" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Opponent</Label>
              <Input className="mt-1" value={form.opponent || ""} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Date</Label>
              <Input type="date" className="mt-1" value={form.game_date || ""} onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Competition</Label>
              <Input className="mt-1" value={form.competition || ""} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-foreground/55">Venue</Label>
              <Input className="mt-1" value={form.venue || ""} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-foreground/55">Team</Label>
              <Input className="mt-1" value={form.team || ""} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveGame} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}