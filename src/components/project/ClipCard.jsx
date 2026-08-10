import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Trash2, ArrowUp, ArrowDown, Play } from "lucide-react";
import ClipPlayer from "@/components/ClipPlayer";
import { CATEGORIES, catMeta, fmtTime, confidenceLabel } from "@/lib/categories";

export default function ClipCard({ clip, source, game, reload, onMove }) {
  const [open, setOpen] = useState(false);
  const meta = catMeta(clip.category);
  const conf = confidenceLabel(clip.confidence || 0);

  const patch = async (data) => { await base44.entities.Clip.update(clip.id, data); reload(); };
  const remove = async () => { await base44.entities.Clip.delete(clip.id); reload(); };

  const statusRing =
    clip.status === "accepted" ? "border-emerald-500/40" :
    clip.status === "rejected" ? "border-rose-500/30 opacity-60" : "border-white/5";

  return (
    <div className={`rounded-3xl border bg-white/[0.03] p-5 ${statusRing}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em] ${meta.bg} ${meta.accent}`}>
              {meta.emoji} {meta.label}
            </span>
            <span className={`text-[11px] font-semibold ${conf.cls}`}>{clip.confidence || 0}% {conf.text}</span>
            {clip.detection_source === "estimated" && (
              <span className="text-[10px] tracking-[0.16em] text-slate-500">ESTIMATED</span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium">{clip.description || clip.play_type || "Detected play"}</p>
          <p className="text-xs text-slate-500">
            {game?.name || "Unassigned game"}{game?.game_date ? ` · ${game.game_date}` : ""} · {fmtTime(clip.start_seconds)}–{fmtTime(clip.end_seconds)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => onMove?.(-1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => onMove?.(1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" className="text-slate-300" onClick={() => setOpen((o) => !o)}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> {open ? "Close" : "Review"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ClipPlayer source={source} start={clip.start_seconds} end={clip.end_seconds} />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">START (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.start_seconds || 0)}
                  onBlur={(e) => patch({ start_seconds: Number(e.target.value) })} />
              </div>
              <div>
                <p className="text-[11px] tracking-[0.18em] text-slate-500">END (S)</p>
                <Input type="number" className="mt-1 border-white/10 bg-white/5" defaultValue={Math.round(clip.end_seconds || 0)}
                  onBlur={(e) => patch({ end_seconds: Number(e.target.value) })} />
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
            <div>
              <p className="text-[11px] tracking-[0.18em] text-slate-500">NOTES</p>
              <Textarea rows={2} className="mt-1 border-white/10 bg-white/5" defaultValue={clip.notes || ""}
                onBlur={(e) => patch({ notes: e.target.value })} />
            </div>
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
        <Button size="sm" variant="ghost" className="text-slate-500 hover:text-rose-400" onClick={remove}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}