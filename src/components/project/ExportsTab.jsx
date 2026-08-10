import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Play, Download, Loader2, AlertTriangle } from "lucide-react";
import TapePreview from "@/components/project/TapePreview";
import { CATEGORIES, fmtTime } from "@/lib/categories";

export default function ExportsTab({ project, games, sources, clips, tapes, reload }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const create = async () => {
    setBusy(true);
    await base44.functions.invoke("createHighlights", { project_id: project.id });
    await reload();
    setBusy(false);
  };

  const accepted = (key) =>
    clips.filter((c) => c.category === key && c.status === "accepted")
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-orange-500/25 bg-orange-500/[0.07] p-6">
        <div>
          <p className="font-heading text-lg font-semibold">Ready to build the tapes?</p>
          <p className="text-sm text-slate-400">Accepted clips are combined into one tape per category, with your intro and outro.</p>
        </div>
        <Button onClick={create} disabled={busy}
          className="h-11 bg-orange-500 px-7 font-semibold tracking-[0.18em] text-slate-950 hover:bg-orange-400">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} CREATE HIGHLIGHTS
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {CATEGORIES.map((c) => {
          const list = accepted(c.key);
          const tape = tapes.find((t) => t.category === c.key);
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
                  <span className="self-center text-[11px] text-slate-500">
                    {tape?.status === "rendering" ? "Building reel…" : "Continuous playable reel in-app"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <TapePreview open={!!preview} onOpenChange={() => setPreview(null)} project={project}
          category={preview} clips={accepted(preview)} sources={sources} games={games} />
      )}
    </div>
  );
}