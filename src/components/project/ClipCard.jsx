import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, ArrowUp, ArrowDown, Pencil, UserCheck, UserX } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import { CATEGORIES, catMeta, fmtTime, confidenceLabel, identityVerdict } from "@/lib/categories";

export default function ClipCard({ clip, source, game, project, reload, onMove }) {
  const [editing, setEditing] = useState(false);
  const meta = catMeta(clip.category);
  const playConf = confidenceLabel(clip.play_confidence ?? clip.confidence ?? 0);
  const idConf = clip.identity_confidence ?? 0;
  const threshold = project?.identity_threshold ?? 90;
  const verdict = identityVerdict(idConf, threshold);
  const confirmed = clip.player_confirmed || "unconfirmed";

  const save = async (data) => { await base44.entities.Clip.update(clip.id, data); };
  const patch = async (data) => { await base44.entities.Clip.update(clip.id, data); reload(); };
  const remove = async () => { await base44.entities.Clip.delete(clip.id); reload(); };
  const toggleEdit = () => { if (editing) reload(); setEditing(!editing); };

  const statusRing =
    clip.status === "accepted" ? "border-emerald-500/40" :
    clip.status === "rejected" ? "border-rose-500/30 opacity-70" : "border-white/5";

  const confirmYes = async () => {
    await patch({ player_confirmed: "yes", status: "accepted" });
  };
  const confirmNo = async () => {
    await patch({ player_confirmed: "no", status: "rejected", notes: (clip.notes ? clip.notes + "\n" : "") + "Player identity rejected by user — re-detect track." });
  };

  const showConfirm = confirmed === "unconfirmed" && clip.status !== "rejected";

  return (
    <div className={`rounded-3xl border bg-white/[0.03] p-5 ${statusRing}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em] ${meta.bg} ${meta.accent}`}>
          {meta.emoji} {meta.label}
        </span>
        <span className={`text-[11px] font-semibold ${verdict.cls}`}>PLAYER {idConf}% · {verdict.text}</span>
        <span className={`text-[11px] font-semibold ${playConf.cls}`}>PLAY {clip.play_confidence ?? clip.confidence ?? 0}% · {playConf.text}</span>
        {clip.detection_source === "ai-vision" && (
          <span className="text-[10px] tracking-[0.16em] text-slate-500">AI VISION</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => onMove?.(-1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => onMove?.(1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={toggleEdit}><Pencil className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-4">
        <ClipPlayer clip={clip} source={source} />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{clip.description || clip.play_type || "Detected play"}</p>
          <p className="text-xs text-slate-500">
            {game?.name || "Unassigned game"}{game?.game_date ? ` · ${game.game_date}` : ""} · {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}
          </p>
        </div>
      </div>

      {showConfirm && (
        <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.07] p-4">
          <p className="text-xs font-medium text-orange-200">Is this your player?</p>
          <p className="mt-1 text-[11px] text-slate-400">Confirm the identity to lock the player track for this game.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={confirmYes} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Yes — this is me
            </Button>
            <Button size="sm" onClick={confirmNo} className="bg-rose-500 text-slate-950 hover:bg-rose-400">
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
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={clip.description || ""}
                placeholder="e.g. Crossover pull-up three"
                onBlur={(e) => save({ description: e.target.value })} />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">PLAY TYPE</p>
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={clip.play_type || ""}
                placeholder="e.g. layup, assist, block"
                onBlur={(e) => save({ play_type: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">START (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.start_seconds || 0)}
                  onBlur={(e) => save({ start_seconds: Number(e.target.value) })} />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">END (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.end_seconds || 0)}
                  onBlur={(e) => save({ end_seconds: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">CATEGORY</p>
              <Select value={clip.category} onValueChange={(v) => patch({ category: v })}>
                <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">PLAY CONFIDENCE</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.play_confidence ?? clip.confidence ?? 0)}
                  onBlur={(e) => save({ play_confidence: Number(e.target.value) })} />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">IDENTITY CONFIDENCE</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.identity_confidence ?? 0)}
                  onBlur={(e) => save({ identity_confidence: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.18em] text-slate-500">NOTES</p>
            <Textarea rows={6} className="mt-1 border-white/10 bg-white/5" defaultValue={clip.notes || ""}
              onBlur={(e) => save({ notes: e.target.value })} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => patch({ status: "accepted" })}
          className={clip.status === "accepted" ? "bg-emerald-500 text-slate-950" : "bg-white/10 hover:bg-white/20"}>
          <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
        </Button>
        <Button size="sm" onClick={() => patch({ status: "rejected" })}
          className={clip.status === "rejected" ? "bg-rose-500 text-slate-950" : "bg-white/10 hover:bg-white/20"}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Reject
        </Button>
        <Button size="sm" onClick={confirmNo} className="bg-white/10 hover:bg-white/20">
          <UserX className="mr-1.5 h-3.5 w-3.5" /> Change player
        </Button>
        <Button size="sm" variant="ghost" className="text-slate-500 hover:text-rose-400" onClick={remove}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}