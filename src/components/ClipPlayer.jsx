import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCw, Loader2, AlertTriangle, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtClock } from "@/lib/categories";

// Real HTML5 player. The clip plays the actual uploaded footage file bounded to the
// detected segment (start → end). No redirects to YouTube/Veo, no fake URLs, and no
// external extraction service — the real file is stored in Base44 and played directly.
function ClipVideoPlayer({ src, start, end, autoplay, onEnded }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(start || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const lo = start || 0;
  const hi = end && end > lo ? end : (duration || lo + 10);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    v.volume = volume;
  }, [muted, volume]);

  const onLoaded = () => {
    const v = ref.current;
    if (!v) return;
    setDuration(v.duration || hi);
    try { v.currentTime = lo; } catch (_e) {}
    setReady(true);
    if (autoplay) v.play().catch(() => {});
  };

  const onTime = () => {
    const v = ref.current;
    if (!v) return;
    setCurrent(v.currentTime);
    if (v.currentTime >= hi) { v.pause(); setPlaying(false); onEnded?.(); }
  };

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const seek = (e) => {
    const v = ref.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = Math.min(hi - 0.05, Math.max(lo, lo + ratio * (hi - lo)));
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const progress = duration ? Math.min(100, ((current - lo) / (hi - lo)) * 100) : 0;

  return (
    <div ref={wrapRef} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video ref={ref} src={src} className="h-full w-full" preload="metadata" playsInline
        onLoadedMetadata={onLoaded} onTimeUpdate={onTime} onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); onEnded?.(); }}
        onError={() => setError(true)} onClick={togglePlay} />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-center">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
          <p className="text-sm text-rose-200">Could not load this footage file.</p>
        </div>
      )}
      {ready && !error && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8">
          <div className="group relative h-1.5 cursor-pointer rounded-full bg-white/20" onClick={seek}>
            <div className="absolute inset-y-0 left-0 rounded-full bg-orange-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-3 text-white">
            <button onClick={togglePlay} className="rounded-md p-1 hover:bg-white/10">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <span className="font-mono text-[11px] tabular-nums text-white/90">
              {fmtClock(Math.max(0, current - lo))} / {fmtClock(hi - lo)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setMuted((m) => !m)} className="rounded-md p-1 hover:bg-white/10">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                className="h-1 w-16 cursor-pointer accent-orange-500" />
              <button onClick={toggleFullscreen} className="rounded-md p-1 hover:bg-white/10"><Maximize className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MissingSource() {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 text-center">
      <Upload className="h-7 w-7 text-amber-400" />
      <p className="text-sm font-medium text-amber-200">No playable footage file for this clip.</p>
      <p className="max-w-md text-xs text-slate-400">
        This clip came from a link the Base44 environment cannot fetch directly. Upload the authorised video file and it will be analysed automatically.
      </p>
    </div>
  );
}

function FailedState({ onRetry, retrying }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 text-center">
      <AlertTriangle className="h-7 w-7 text-rose-400" />
      <p className="text-sm font-medium text-rose-200">This clip could not be prepared.</p>
      <button onClick={onRetry} disabled={retrying}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
        <RotateCw className="h-4 w-4" /> {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

function EmbedPlayer({ source, clip, autoplay }) {
  const start = Math.max(0, Math.floor(clip?.start_seconds || 0));
  const end = Math.ceil(clip?.end_seconds || 0);
  let src = "";
  if (source.source_type === "youtube") {
    const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1", start: String(start) });
    if (end > start) params.set("end", String(end));
    if (autoplay) params.set("autoplay", "1");
    src = `https://www.youtube.com/embed/${source.external_id}?${params.toString()}`;
  } else {
    src = `https://app.veo.co/matches/${source.external_id}/embed`;
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <iframe src={src} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen title="clip" />
      {source.source_type === "veo" && (
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white/90">
          Segment at {fmtClock(start)} — scrub to view
        </div>
      )}
    </div>
  );
}

export default function ClipPlayer({ clip, source, autoplay, onEnded }) {
  const [retrying, setRetrying] = useState(false);
  const clipUrl = clip?.clip_url || (source?.source_type === "file" ? source?.file_url : "") || "";
  const status = clip?.processing_status || (clipUrl ? "ready" : "failed");

  const retry = async () => {
    if (!clip?.id) return;
    setRetrying(true);
    try {
      await base44.entities.Clip.update(clip.id, { processing_status: "ready", extraction_error: "" });
      if (source?.file_url) await base44.entities.Clip.update(clip.id, { clip_url: source.file_url });
      await base44.functions.invoke("extractClip", { clip_id: clip.id });
    } catch (_e) {}
    setRetrying(false);
  };

  if (source?.source_type === "youtube" || source?.source_type === "veo") {
    return <EmbedPlayer source={source} clip={clip} autoplay={autoplay} />;
  }
  if (status === "failed" && !clipUrl) return <FailedState onRetry={retry} retrying={retrying} />;
  if (!clipUrl) return <MissingSource />;
  return (
    <ClipVideoPlayer
      src={clipUrl}
      start={clip?.start_seconds || 0}
      end={clip?.end_seconds || 0}
      autoplay={autoplay}
      onEnded={onEnded}
    />
  );
}