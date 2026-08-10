import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCw, Loader2, AlertTriangle, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtClock } from "@/lib/categories";

// Real HTML5 video player that plays the actual extracted clip segment.
// For uploaded file sources the browser plays only the requested time range.
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
    if (v.currentTime >= hi) {
      v.pause();
      setPlaying(false);
      onEnded?.();
    }
  };

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const seek = (e) => {
    const v = ref.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const target = lo + ratio * (hi - lo);
    v.currentTime = Math.min(hi - 0.05, Math.max(lo, target));
  };

  const toggleMute = () => setMuted((m) => !m);
  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const progress = duration ? Math.min(100, ((current - lo) / (hi - lo)) * 100) : 0;

  return (
    <div ref={wrapRef} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={ref}
        src={src}
        className="h-full w-full"
        preload="metadata"
        playsInline
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onError={() => setError(true)}
        onClick={togglePlay}
      />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-center">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
          <p className="text-sm text-rose-200">Could not load this clip file.</p>
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
              <button onClick={toggleMute} className="rounded-md p-1 hover:bg-white/10">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                className="h-1 w-16 cursor-pointer accent-orange-500"
              />
              <button onClick={toggleFullscreen} className="rounded-md p-1 hover:bg-white/10">
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// States shown when no playable clip file exists yet.
function ProcessingState({ status, error, onRetry }) {
  if (status === "extracting") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
        <p className="text-sm font-medium text-slate-200">Preparing clip…</p>
        <p className="text-xs text-slate-500">Extracting the exact segment from your footage.</p>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 text-center">
        <AlertTriangle className="h-7 w-7 text-rose-400" />
        <p className="text-sm font-medium text-rose-200">Clip extraction failed</p>
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950">
          <RotateCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }
  if (status === "unprocessable") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 text-center">
        <Lock className="h-7 w-7 text-amber-400" />
        <p className="text-sm font-medium text-amber-200">This video cannot currently be processed.</p>
        <p className="max-w-md text-xs text-slate-400">
          Please provide a video source that the processing service is authorised to access — upload the footage file directly, or connect an authorised video processing provider.
        </p>
      </div>
    );
  }
  return null;
}

export default function ClipPlayer({ clip, source, autoplay, onEnded }) {
  const [retrying, setRetrying] = useState(false);

  const clipUrl = clip?.clip_url || (source?.source_type === "file" ? source?.file_url || source?.url : "");
  const status = clip?.processing_status || (clipUrl ? "ready" : "unprocessable");
  const playable = status === "ready" && Boolean(clipUrl);

  const retry = useCallback(async () => {
    if (!clip?.id) return;
    setRetrying(true);
    try {
      await base44.entities.Clip.update(clip.id, { processing_status: "extracting", extraction_error: "" });
      await base44.functions.invoke("extractClip", { clip_id: clip.id });
    } catch (_e) {}
    setRetrying(false);
  }, [clip?.id]);

  if (status === "extracting" || retrying) {
    return <ProcessingState status="extracting" />;
  }
  if (status === "failed") {
    return <ProcessingState status="failed" onRetry={retry} />;
  }
  if (status === "unprocessable") {
    return <ProcessingState status="unprocessable" />;
  }
  if (playable) {
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
  return <ProcessingState status="unprocessable" />;
}