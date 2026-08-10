import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { fmtTime, catMeta } from "@/lib/categories";
import { Play, Loader2, AlertTriangle } from "lucide-react";

function ClipTile({ clip, game, projectId }) {
  const [open, setOpen] = useState(false);
  const meta = catMeta(clip.category);
  const dur = Math.max(1, (clip.end_seconds || 0) - (clip.start_seconds || 0));
  return (
    <div>
      <button
        onClick={() => { setOpen(true); base44.functions.invoke("trackPortfolioEvent", { project_id: projectId, event_type: "highlight_play", category: clip.category }).catch(() => {}); }}
        className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900"
      >
        {clip.thumbnail_url ? (
          <Image src={clip.thumbnail_url} alt={clip.description || clip.category} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${meta.bg}`}>
            <span className="text-3xl">{meta.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <Play className="h-8 w-8 text-white" />
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white/90">{fmtTime(dur)}</span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-300">{clip.description || meta.label}</p>
        <span className={`text-[10px] tracking-[0.2em] ${meta.accent}`}>{meta.label}</span>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <video src={clip.clip_url} controls autoPlay className="aspect-video w-full rounded-xl bg-black" />
            <p className="mt-3 text-center text-sm text-slate-300">{clip.description || meta.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HighlightsSection({ tapes, groups, gameIdMap, projectId }) {
  if (!tapes.length && !groups.length) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-amber-400" />
        <p className="mt-3 text-sm text-slate-400">No highlight clips are published yet. Check back soon.</p>
      </section>
    );
  }
  return (
    <section className="space-y-12">
      <div>
        <h2 className="text-[11px] tracking-[0.3em] text-orange-400">HIGHLIGHT TAPES</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {tapes.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {t.video_url ? (
                <video src={t.video_url} controls className="aspect-video w-full bg-black" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-slate-900 text-3xl">{catMeta(t.category).emoji}</div>
              )}
              <div className="flex items-center justify-between p-4">
                <p className="font-medium">{t.title || t.category}</p>
                <span className="text-xs text-slate-500">{t.clip_count} clips · {fmtTime(t.duration_seconds)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {groups.map(({ category, clips }) => (
      <div key={category.key}>
        <h2 className="text-[11px] tracking-[0.3em] text-orange-400">{category.label}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((c) => (
            <ClipTile key={c.id} clip={c} game={gameIdMap[c.game_id]} projectId={projectId} />
          ))}
        </div>
      </div>
      ))}
    </section>
  );
}