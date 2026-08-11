import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GripVertical, Trash2, Plus, Loader2, Save, Play } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import { catMeta, fmtTime } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

// Manual reel builder: reorder, delete, add clips, edit intro/outro, preview.
// Bound to a HighlightTape's clip_ids — persists on every change.
export default function ReelEditor({ open, onOpenChange, tape, clips, sources, games, project }) {
  const [ids, setIds] = useState([]);
  const [intro, setIntro] = useState("");
  const [outro, setOutro] = useState("");
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState(false);
  const { toast } = useToast();

  // Sync local state from the tape whenever the edited reel changes.
  useEffect(() => {
    if (tape) {
      setIds(tape.clip_ids || []);
      setIntro(tape.intro_text || "");
      setOutro(tape.outro_text || "");
    }
  }, [tape?.id]);

  const tapeClips = ids.map((id) => clips.find((c) => c.id === id)).filter(Boolean);
  const available = clips.filter((c) => c.status === "accepted" && c.processing_status === "ready" && !ids.includes(c.id));

  const onDragEnd = (r) => {
    if (!r.destination) return;
    const next = Array.from(ids);
    const [moved] = next.splice(r.source.index, 1);
    next.splice(r.destination.index, 0, moved);
    setIds(next);
  };

  const remove = (id) => setIds((s) => s.filter((x) => x !== id));
  const add = (id) => setIds((s) => [...s, id]);

  const persist = async () => {
    setSaving(true);
    try {
      const duration = tapeClips.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
      await base44.entities.HighlightTape.update(tape.id, {
        clip_ids: ids, clip_count: ids.length, duration_seconds: duration,
        intro_text: intro, outro_text: outro,
      });
      toast({ title: "Reel saved", description: `${ids.length} clips · ${fmtTime(duration)}` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Could not save", description: e?.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-slate-950 p-0 text-slate-100">
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-orange-400">REEL EDITOR</p>
              <h3 className="mt-1 font-heading text-xl font-semibold">{tape?.version_label || tape?.title || "Highlight reel"}</h3>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/15 bg-transparent" disabled={!ids.length} onClick={() => setPreview(true)}>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Preview
              </Button>
              <Button size="sm" onClick={persist} disabled={saving} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />} Save
              </Button>
            </div>
          </div>

          {/* Intro / Outro */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-slate-400">Intro text</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Name · Position · Team 2026 Highlights" />
            </div>
            <div>
              <Label className="text-xs text-slate-400">Outro text</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={outro} onChange={(e) => setOutro(e.target.value)} placeholder="Contact: coach@school.edu" />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">Timeline · {ids.length} clips · drag to reorder</Label>
              <Button size="sm" variant="outline" className="border-white/15 bg-transparent" onClick={() => setPicker(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add clip
              </Button>
            </div>

            {ids.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
                No clips yet. Add some to build your reel.
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="reel">
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.droppableProps} className="mt-3 space-y-2">
                      {tapeClips.map((c, i) => {
                        const meta = catMeta(c.category);
                        const game = games.find((g) => g.id === c.game_id);
                        return (
                          <Draggable key={c.id} draggableId={c.id} index={i}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{meta.emoji} {c.play_type || c.description || meta.label}</p>
                                  <p className="text-[11px] text-slate-500">{game?.name || "Game"} · {fmtTime(c.start_seconds)}–{fmtTime(c.end_seconds)} · ★ {c.highlight_score || 0}</p>
                                </div>
                                <button onClick={() => remove(c.id)} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-300">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Add-clip picker */}
      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto border-white/10 bg-slate-950 text-slate-100">
          <DialogHeader><DialogTitle>Add clips to reel</DialogTitle></DialogHeader>
          {available.length === 0 ? (
            <p className="text-sm text-slate-400">No more accepted clips available.</p>
          ) : (
            <div className="space-y-1">
              {available.map((c) => {
                const meta = catMeta(c.category);
                const game = games.find((g) => g.id === c.game_id);
                return (
                  <button key={c.id} onClick={() => { add(c.id); setPicker(false); }}
                    className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-sm hover:bg-white/5">
                    <span className="min-w-0 truncate">{meta.emoji} {c.play_type || c.description || meta.label} · {game?.name || "Game"}</span>
                    <Plus className="h-4 w-4 shrink-0 text-orange-400" />
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-3xl border-white/10 bg-slate-950 p-0 text-slate-100">
          <ReelPreview ids={ids} clips={clips} sources={sources} intro={intro} outro={outro} project={project} />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ReelPreview({ ids, clips, sources, intro, outro, project }) {
  const [i, setI] = useState(0);
  const clip = i < ids.length ? clips.find((c) => c.id === ids[i]) : null;
  const source = clip ? sources.find((s) => s.id === clip.video_source_id) : null;
  return (
    <div className="p-6">
      <p className="text-[11px] tracking-[0.3em] text-orange-400">PREVIEW</p>
      <div className="mt-3">
        {!clip ? (
          <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-900 text-center">
            <p className="font-heading text-2xl font-semibold">{outro || project?.player_name}</p>
            <p className="mt-2 text-xs tracking-[0.28em] text-slate-500">END OF REEL</p>
          </div>
        ) : i === -1 ? (
          <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-800 text-center">
            <p className="font-heading text-2xl font-bold uppercase">{intro || project?.player_name}</p>
            <p className="mt-2 text-xs tracking-[0.3em] text-slate-400">{project?.season || "2026"} HIGHLIGHTS</p>
          </div>
        ) : (
          <ClipPlayer clip={clip} source={source} autoplay onEnded={() => setI((n) => n + 1)} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{Math.min(i + 1, ids.length)} / {ids.length}</span>
        <Button size="sm" variant="ghost" onClick={() => setI((n) => n + 1)}>Next</Button>
      </div>
    </div>
  );
}