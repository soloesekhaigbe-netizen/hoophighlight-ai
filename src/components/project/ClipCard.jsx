import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileSelect from "@/components/ui/mobile-select";
import { Check, X, Trash2, ArrowUp, ArrowDown, Pencil, UserCheck, UserX, Star } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import { CATEGORIES, catMeta, fmtTime, confidenceLabel, identityVerdict } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

export default function ClipCard({ clip, source, game, project, reload, onMove, tapes }) {
  const [editing, setEditing] = useState(false);
  // Optimistic local overrides — applied instantly so the UI never waits on a
  // round-trip for favourite toggles, status changes, or category switches.
  const [local, setLocal] = useState({});
  const { toast } = useToast();
  const cur = { ...clip, ...local };
  const meta = catMeta(cur.category);
  const playConf = confidenceLabel(cur.play_confidence ?? cur.confidence ?? 0);
  const idConf = cur.identity_confidence ?? 0;
  const threshold = project?.identity_threshold ?? 90;
  const verdict = identityVerdict(idConf, threshold);
  const confirmed = cur.player_confirmed || "unconfirmed";
  const dur = Math.max(0, (cur.end_seconds || 0) - (cur.start_seconds || 0));

  const save = async (data) => { await base44.entities.Clip.update(clip.id, data); };
  const patch = async (data) => {
    setLocal((p) => ({ ...p, ...data }));
    try {
      await base44.entities.Clip.update(clip.id, data);
      reload();
    } catch (e) {
      // Roll back on failure so the UI reflects the real state.
      setLocal((p) => {
        const next = { ...p };
        Object.keys(data).forEach((k) => { delete next[k]; });
        return next;
      });
      toast({ title: "Could not update clip", description: e?.message, variant: "destructive" });
    }
  };
  const remove = async () => { await base44.entities.Clip.delete(clip.id); reload(); };
  const toggleEdit = () => { if (editing) reload(); setEditing(!editing); };

  const statusRing =
    cur.status === "accepted" ? "border-emerald-500/40" :
    cur.status === "rejected" ? "border-rose-500/30 opacity-70" : "border-white/5";

  const confirmYes = async () => { await patch({ player_confirmed: "yes", status: "accepted" }); };
  const confirmNo = async () => {
    await patch({ player_confirmed: "no", status: "rejected", notes: (cur.notes ? cur.notes + "\n" : "") + "Player identity rejected by user — re-detect track." });
  };

  const showConfirm = confirmed === "unconfirmed" && cur.status !== "rejected";
  const mixReels = (tapes || []).filter((t) => t.category === "mix");

  const addToReel = async (tapeId) => {
    if (!tapeId) return;
    const tape = mixReels.find((t) => t.id === tapeId);
    if (!tape) return;
    if ((tape.clip_ids || []).includes(clip.id)) {
      toast({ title: "Already in this reel" });
      return;
    }
    const clipIds = [...(tape.clip_ids || []), clip.id];
    await base44.entities.HighlightTape.update(tapeId, {
      clip_ids: clipIds,
      clip_count: clipIds.length,
      duration_seconds: (tape.duration_seconds || 0) + Math.max(1, dur),
    });
    toast({ title: "Added to reel", description: tape.version_label || tape.title });
    reload?.();
  };

  // Touch-target sized icon buttons: 44px on mobile, compact on desktop.
  const iconBtn = "h-11 w-11 md:h-8 md:w-8";

  return (
    <div className={`glass squircle-lg p-5 ${statusRing}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em] ${meta.bg} ${meta.accent}`}>
          {meta.emoji} {meta.label}
        </span>
        {cur.play_type && <span className="text-[11px] font-semibold text-slate-300">{cur.play_type}</span>}
        <span className={`text-[11px] font-semibold ${verdict.cls}`}>PLAYER {idConf}% · {verdict.text}</span>
        <span className={`text-[11px] font-semibold ${playConf.cls}`}>PLAY {cur.play_confidence ?? cur.confidence ?? 0}% · {playConf.text}</span>
        {cur.detection_source === "ai-vision" && (
          <span className="text-[10px] tracking-[0.16em] text-slate-500">AUTO</span>
        )}
        {(cur.highlight_score || 0) > 0 && (
          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-semibold text-orange-300" title="Quality score">★ {cur.highlight_score}</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className={`${iconBtn} ${cur.favourite ? "text-orange-400" : "text-slate-400 hover:text-orange-400"}`} onClick={() => patch({ favourite: !cur.favourite })}>
            <Star className={`h-4 w-4 ${cur.favourite ? "fill-orange-400" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" className={`${iconBtn} text-slate-400 hover:text-white`} onClick={() => onMove?.(-1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className={`${iconBtn} text-slate-400 hover:text-white`} onClick={() => onMove?.(1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className={`${iconBtn} text-slate-400 hover:text-white`} onClick={toggleEdit}><Pencil className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-4">
        <ClipPlayer clip={cur} source={source} />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{cur.description || cur.play_type || "Detected play"}</p>
          <p className="text-xs text-slate-500">
            {game?.name || "Unassigned game"}{game?.game_date ? ` · ${game.game_date}` : ""} · {fmtTime(cur.start_seconds)}–{fmtTime(cur.end_seconds)} · {fmtTime(dur)} long
          </p>
        </div>
      </div>

      {showConfirm && (
        <div className="mt-4 glass-tint squircle p-4">
          <p className="text-xs font-medium text-orange-200">Is this your player?</p>
          <p className="mt-1 text-[11px] text-slate-400">Confirm the identity to lock the player track for this game.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={confirmYes} className="h-11 md:h-9 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Yes — this is me
            </Button>
            <Button size="sm" onClick={confirmNo} className="h-11 md:h-9 bg-rose-500 text-slate-950 hover:bg-rose-400">
              <UserX className="mr-1.5 h-3.5 w-3.5" /> No — not me
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">NAME</p>
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={cur.description || ""}
                placeholder="e.g. Crossover pull-up three"
                onBlur={(e) => save({ description: e.target.value })} />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">PLAY TYPE</p>
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={cur.play_type || ""}
                placeholder="e.g. layup, assist, block"
                onBlur={(e) => save({ play_type: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">START (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(cur.start_seconds || 0)}
                  onBlur={(e) => save({ start_seconds: Number(e.target.value) })} />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">END (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(cur.end_seconds || 0)}
                  onBlur={(e) => save({ end_seconds: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">CATEGORY</p>
              <MobileSelect
                value={cur.category}
                onValueChange={(v) => patch({ category: v })}
                title="Category"
                triggerClassName="mt-1 w-full border-white/10 bg-white/5"
                options={CATEGORIES.map((c) => ({ value: c.key, label: `${c.emoji} ${c.label}` }))}
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-slate-500">NOTES</p>
            <Textarea rows={6} className="mt-1 border-white/10 bg-white/5" defaultValue={cur.notes || ""}
              onBlur={(e) => save({ notes: e.target.value })} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => patch({ status: "accepted" })}
          className={`h-11 md:h-9 ${cur.status === "accepted" ? "bg-emerald-500 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}>
          <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
        </Button>
        <Button size="sm" onClick={() => patch({ status: "rejected" })}
          className={`h-11 md:h-9 ${cur.status === "rejected" ? "bg-rose-500 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Reject
        </Button>
        {mixReels.length > 0 && (
          <MobileSelect
            value=""
            onValueChange={addToReel}
            placeholder="Add to reel"
            title="Add to reel"
            triggerClassName="h-11 md:h-8 w-36 border-white/10 bg-white/5 text-xs"
            options={mixReels.map((t) => ({ value: t.id, label: t.version_label || t.title || "Reel" }))}
          />
        )}
        <Button size="sm" variant="ghost" className="h-11 md:h-9 text-slate-500 hover:text-rose-400" onClick={remove}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}