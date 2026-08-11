import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Download, Loader2, AlertTriangle, RotateCw, Trash2, Star, Pencil } from "lucide-react";
import TapePreview from "@/components/project/TapePreview";
import ReelPlayer from "@/components/project/ReelPlayer";
import CreateReelDialog from "@/components/project/CreateReelDialog";
import SharePortfolioButton from "@/components/SharePortfolioButton";
import { useToast } from "@/components/ui/use-toast";
import { CATEGORIES, fmtTime } from "@/lib/categories";

export default function ExportsTab({ project, games, sources, clips, tapes, reload }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [reel, setReel] = useState(null);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelVal, setLabelVal] = useState("");
  const { toast } = useToast();

  const create = async () => {
    setBusy(true);
    await base44.functions.invoke("createHighlights", { project_id: project.id });
    await reload();
    setBusy(false);
  };

  const reels = tapes.filter((t) => t.category === "mix").sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const catTapes = tapes.filter((t) => t.category !== "mix");

  const accepted = (key) =>
    clips.filter((c) => c.category === key && c.status === "accepted")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const regenerate = async (tape) => {
    setBusy(true);
    try {
      await base44.functions.invoke("generateHighlightReel", {
        project_id: project.id,
        game_ids: tape.game_ids || [],
        settings: { reel_length: tape.reel_length, selection_mode: tape.selection_mode, style: tape.style, include_fields: tape.include_fields || {} },
      });
      toast({ title: "New version generated", description: "Saved as a separate reel." });
      reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally { setBusy(false); }
  };

  const saveLabel = async (tape) => {
    await base44.entities.HighlightTape.update(tape.id, { version_label: labelVal });
    setEditingLabel(null); reload();
  };
  const toggleFeature = async (tape) => {
    if (tape.is_featured) {
      await base44.entities.HighlightTape.update(tape.id, { is_featured: false });
    } else {
      await base44.entities.HighlightTape.updateMany({ project_id: project.id }, { $set: { is_featured: false } });
      await base44.entities.HighlightTape.update(tape.id, { is_featured: true });
    }
    reload();
  };
  const removeReel = async (tape) => { await base44.entities.HighlightTape.delete(tape.id); reload(); };

  return (
    <div className="space-y-10">
      {/* Highlight Reel — primary feature */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-transparent p-6">
          <div>
            <p className="font-heading text-lg font-semibold">✨ Highlight Reel</p>
            <p className="text-sm text-slate-400">Pick one or more games — ranks, sequences and builds a professional reel from your best clips.</p>
          </div>
          <CreateReelDialog project={project} games={games} clips={clips} reload={reload} />
        </div>

        {reels.length > 0 && (
          <div className="mt-5 space-y-3">
            {reels.map((t) => {
              const reelClips = (t.clip_ids || []).map((id) => clips.find((c) => c.id === id)).filter(Boolean);
              const avgScore = reelClips.length ? Math.round(reelClips.reduce((s, c) => s + (c.highlight_score || 0), 0) / reelClips.length) : 0;
              return (
                <div key={t.id} className="rounded-3xl border border-white/5 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {editingLabel === t.id ? (
                        <div className="flex items-center gap-2">
                          <Input autoFocus value={labelVal} onChange={(e) => setLabelVal(e.target.value)}
                            onBlur={() => saveLabel(t)} onKeyDown={(e) => e.key === "Enter" && saveLabel(t)}
                            className="h-8 w-56 border-white/10 bg-white/5" placeholder="Version label" />
                        </div>
                      ) : (
                        <button className="group flex items-center gap-2" onClick={() => { setEditingLabel(t.id); setLabelVal(t.version_label || ""); }}>
                          <p className="font-heading text-lg font-semibold">{t.version_label || t.title}</p>
                          <Pencil className="h-3.5 w-3.5 text-slate-500 opacity-0 transition group-hover:opacity-100" />
                        </button>
                      )}
                      <p className="text-xs text-slate-500">
                        {t.clip_count} clips · {fmtTime(t.duration_seconds)} · {t.reel_length || "—"} · {t.style || "—"}{avgScore > 0 ? ` · avg score ${avgScore}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className={t.is_featured ? "text-orange-400" : "text-slate-500 hover:text-orange-400"} onClick={() => toggleFeature(t)} title="Feature on portfolio">
                        <Star className={`h-4 w-4 ${t.is_featured ? "fill-orange-400" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-white" onClick={() => regenerate(t)} title="Regenerate (new version)"><RotateCw className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-slate-500 hover:text-rose-400" onClick={() => removeReel(t)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" disabled={!t.clip_count} onClick={() => setReel(t)} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                      <Play className="mr-1.5 h-3.5 w-3.5" /> Play reel
                    </Button>
                    <SharePortfolioButton project={project} tone="light" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-category tapes — secondary */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div>
            <p className="font-heading text-base font-semibold">Category tapes</p>
            <p className="text-sm text-slate-400">One tape per category, combining every accepted clip.</p>
          </div>
          <Button onClick={create} disabled={busy} variant="outline" className="border-white/15 bg-transparent">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} REBUILD CATEGORY TAPES
          </Button>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {CATEGORIES.map((c) => {
            const list = accepted(c.key);
            const tape = catTapes.find((t) => t.category === c.key);
            const duration = list.reduce((s, x) => s + Math.max(1, (x.end_seconds || 0) - (x.start_seconds || 0)), 0);
            return (
              <div key={c.key} className={`rounded-3xl border border-white/5 bg-white/[0.03] p-7 ring-1 ring-inset ${c.ring}`}>
                <p className="text-4xl">{c.emoji}</p>
                <p className={`mt-4 font-heading text-2xl font-semibold tracking-[0.1em] ${c.accent}`}>{c.label}</p>
                <p className="mt-1 text-sm text-slate-400">{project.player_name} — {c.label}</p>
                <div className="mt-5 flex gap-6 text-sm">
                  <div><p className="text-2xl font-semibold">{list.length}</p><p className="text-[10px] tracking-[0.2em] text-slate-500">CLIPS</p></div>
                  <div><p className="text-2xl font-semibold">{fmtTime(duration)}</p><p className="text-[10px] tracking-[0.2em] text-slate-500">RUNTIME</p></div>
                </div>
                {tape?.error_message && (
                  <p className="mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{tape.error_message}
                  </p>
                )}
                <div className="mt-6 flex gap-3">
                  <Button disabled={!list.length} onClick={() => setPreview(c.key)} className="bg-white/10 hover:bg-white/20">
                    <Play className="mr-2 h-4 w-4" /> Preview tape
                  </Button>
                  {tape?.video_url ? (
                    <a href={tape.video_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-slate-950">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                  ) : (
                    <span className="self-center text-[11px] text-slate-500">Continuous playable reel in-app</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {preview && (
        <TapePreview open={!!preview} onOpenChange={() => setPreview(null)} project={project}
          category={preview} clips={accepted(preview)} sources={sources} games={games} />
      )}
      {reel && (
        <ReelPlayer open={!!reel} onOpenChange={() => setReel(null)} tape={reel}
          clips={clips} sources={sources} games={games} project={project} />
      )}
    </div>
  );
}