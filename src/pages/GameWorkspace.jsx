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
import { fmtTime, ACTIVE_STATUSES } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

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

      // Clean dangling reel references.
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

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-ink"><Loader2 className="h-8 w-8 animate-spin text-sun" /></div>;
  const { game, sources, clips, project } = state;
  if (!game) return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-ink px-6 text-center text-paper">
      <p className="font-display text-3xl uppercase">Game not found</p>
      <Link to={`/project/${id}?tab=games`} className="label-sm text-sun">Back to games</Link>
    </div>
  );

  const accepted = clips.filter((c) => c.status === "accepted");
  const highlightDur = accepted.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
  const fullSource = sources.find((s) => s.source_type === "file" && s.file_url) || sources[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to={`/project/${id}?tab=games`} className="label-xs inline-flex items-center gap-2 text-paper/50 hover:text-sun">
        <ArrowLeft className="h-4 w-4" /> Games
      </Link>

      {/* Game header */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase leading-[0.9] sm:text-6xl">{game.name}</h1>
          <p className="mt-3 text-sm text-paper/55">
            {[game.opponent && `vs ${game.opponent}`, game.game_date, game.competition, game.venue].filter(Boolean).join(" · ") || "No details"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-white/15 bg-transparent hover:bg-white/10" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/15 bg-transparent hover:bg-white/10" disabled={replacing}>
                {replacing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Replace
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-slate-950 text-slate-100">
              <DialogHeader><DialogTitle>Upload replacement footage</DialogTitle></DialogHeader>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-8 hover:border-orange-500/50">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm text-slate-300">Choose a video file</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => addReplacement(e.target.files?.[0])} />
              </label>
            </DialogContent>
          </Dialog>
          {accepted.length > 0 && (
            <CreateReelDialog project={project} games={[game]} clips={clips} reload={load} presetGameIds={[gameId]}
              trigger={<Button className="bg-orange-500 text-slate-950 hover:bg-orange-400"><Sparkles className="mr-2 h-4 w-4" /> Reel</Button>} />
          )}
          <Button variant="ghost" className="text-slate-500 hover:text-rose-400" disabled={deleting} onClick={removeGame}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Statistics strip */}
      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10">
        {[
          ["CLIPS", clips.length],
          ["RECORDINGS", sources.length],
          ["HIGHLIGHTS", fmtTime(highlightDur)],
        ].map(([l, v]) => (
          <div key={l} className="bg-ink-soft px-4 py-4 text-center">
            <p className="font-display text-3xl leading-none">{v}</p>
            <p className="label-xs mt-1.5 text-paper/45">{l}</p>
          </div>
        ))}
      </div>

      {/* Full game player */}
      <div className="mt-8">
        <h2 className="label-xs mb-3 text-paper/50">Full game</h2>
        {fullSource ? (
          fullSource.source_type === "file" && fullSource.file_url ? (
            <ClipPlayer clip={{ clip_url: fullSource.file_url, start_seconds: 0, end_seconds: 0, processing_status: "ready" }} source={{ source_type: "file" }} />
          ) : (
            <ClipPlayer clip={{ clip_url: "", start_seconds: 0, end_seconds: 0, processing_status: "ready" }} source={fullSource} />
          )
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-white/10 text-paper/40">
            <Film className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Processing */}
      {sources.some((s) => ACTIVE_STATUSES.includes(s.status)) && (
        <div className="mt-6 rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
          <p className="label-xs text-orange-300">Processing</p>
          <div className="mt-3 space-y-2">
            {sources.filter((s) => ACTIVE_STATUSES.includes(s.status)).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <StatusBadge status={s.status} />
                <span className="text-xs text-paper/50">{s.title} · {s.progress || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clips */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-3">
          <h2 className="font-display text-2xl uppercase">Clips</h2>
          <span className="label-xs text-paper/40">{clips.length}</span>
        </div>
        {clips.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-paper/40">
            No clips for this game yet. {sources.some((s) => ACTIVE_STATUSES.includes(s.status)) ? "Analysis is running." : "Add clips manually from the Clips tab."}
          </div>
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
        <DialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit game</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-400">Game name</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Opponent</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.opponent || ""} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Date</Label>
              <Input type="date" className="mt-1 border-white/10 bg-white/5" value={form.game_date || ""} onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Competition</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.competition || ""} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Venue</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.venue || ""} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-400">Team</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.team || ""} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveGame} disabled={saving} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}