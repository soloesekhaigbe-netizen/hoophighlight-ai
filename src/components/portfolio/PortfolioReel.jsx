import { Image } from "@/components/ui/image";
import { Play } from "lucide-react";
import { catMeta, fmtTime } from "@/lib/categories";

// Featured reel hero: large play card + a side stack of two reel clips.
export default function PortfolioReel({ featured, clips, onPlay }) {
  if (!featured) return null;
  const reelClips = (featured.clip_ids || [])
    .map((cid) => clips.find((c) => c.id === cid))
    .filter(Boolean);
  const sideClips = reelClips.slice(0, 2);
  const title = featured.version_label || featured.title || "Season Highlights";

  return (
    <section id="reel" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <h2 className="display-xl text-4xl sm:text-6xl">Highlight reel.</h2>
        <span className="label-xs text-foreground/50">{featured.clip_count} clips</span>
      </div>

      <div className={`mt-6 grid gap-4 ${sideClips.length ? "lg:grid-cols-3" : ""}`}>
        <button
          onClick={onPlay}
          className={`group relative overflow-hidden glass-strong squircle-xl text-left ${sideClips.length ? "lg:col-span-2" : ""}`}
        >
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-black/30">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground shadow-glow transition group-hover:scale-110">
              <Play className="ml-1 h-7 w-7" />
            </span>
            <span className="font-display text-2xl uppercase sm:text-3xl">{title}</span>
            <span className="label-xs text-foreground/60">Tap to play · {featured.clip_count} clips</span>
          </div>
        </button>

        {sideClips.length > 0 && (
          <div className="grid gap-4">
            {sideClips.map((c) => {
              const meta = catMeta(c.category);
              return (
                <button
                  key={c.id}
                  onClick={onPlay}
                  className="group relative overflow-hidden glass squircle-lg text-left"
                >
                  <div className="relative aspect-video w-full bg-black/40">
                    {c.thumbnail_url ? (
                      <Image src={c.thumbnail_url} alt={c.description || meta.label} fittingType="fill" className="h-full w-full" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">{meta.emoji}</div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground">
                        <Play className="ml-0.5 h-4 w-4" />
                      </span>
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{c.description || meta.label}</p>
                    <p className="mt-1 label-xs text-foreground/50">
                      Segment {fmtTime(c.start_seconds)}–{fmtTime(c.end_seconds)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}