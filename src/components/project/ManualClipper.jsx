import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Flag, Play } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

// Show seconds with one decimal — manual marking benefits from sub-second precision.
function fmt(s = 0) {
  const t = Math.max(0, Number(s) || 0);
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  const dec = Math.floor((t % 1) * 10);
  return `${m}:${String(sec).padStart(2, "0")}.${dec}`;
}

// Load the YouTube IFrame Player API exactly once across the app.
let ytPromise = null;
function loadYouTubeAPI() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return ytPromise;
}

// Shared row: live timestamp + Preview + Mark In / Mark Out.
function MarkerBar({ current, duration, start, end, onPreview, onIn, onOut }) {
  const valid = Number(end) > Number(start);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="font-mono text-sm text-slate-300">{fmt(current)} / {fmt(duration)}</span>
      <span className="text-[11px] text-slate-500">·</span>
      <span className={`font-mono text-xs ${valid ? "text-orange-300" : "text-slate-500"}`}>
        In {fmt(start)} → Out {fmt(end)}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="border-white/15 bg-transparent" disabled={!valid} onClick={onPreview}>
          <Play className="mr-1.5 h-3.5 w-3.5" /> Preview
        </Button>
        <Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400" onClick={onIn}>
          <Flag className="mr-1.5 h-3.5 w-3.5" /> Mark In
        </Button>
        <Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400" onClick={onOut}>
          <Flag className="mr-1.5 h-3.5 w-3.5" /> Mark Out
        </Button>
      </div>
    </div>
  );
}

// Uploaded file: native HTML5 controls — the scrubber gives exact frame access.
function FileMarker({ src, start, end, setStart, setEnd }) {
  const ref = useRef(null);
  const endRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const t = () => (ref.current?.currentTime ? Math.round(ref.current.currentTime * 10) / 10 : 0);

  const onTime = (e) => {
    const v = e.currentTarget;
    setCurrent(v.currentTime);
    if (endRef.current && v.currentTime >= endRef.current) { v.pause(); endRef.current = null; }
  };

  const preview = () => {
    const v = ref.current;
    if (!v) return;
    endRef.current = Number(end) || null;
    v.currentTime = Number(start) || 0;
    v.play().catch(() => {});
  };

  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <video ref={ref} src={src} className="h-full w-full" controls playsInline
          onTimeUpdate={onTime}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
      </div>
      <MarkerBar current={current} duration={duration} start={start} end={end}
        onPreview={preview} onIn={() => setStart(t())} onOut={() => setEnd(t())} />
    </>
  );
}

// YouTube: use the IFrame Player API so we can read the real scrub position and
// mark in/out from the exact frame the user is watching.
function YouTubeMarker({ videoId, start, end, setStart, setEnd }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const endRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let poll;
    let destroyed = false;
    loadYouTubeAPI().then((YT) => {
      if (!YT || destroyed || !hostRef.current) return;
      hostRef.current.innerHTML = "";
      const child = document.createElement("div");
      hostRef.current.appendChild(child);
      playerRef.current = new YT.Player(child, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: window.location.origin },
        events: { onReady: (e) => setDuration(e.target.getDuration() || 0) },
      });
      poll = setInterval(() => {
        try {
          const p = playerRef.current;
          if (p && p.getCurrentTime) {
            const c = p.getCurrentTime() || 0;
            setCurrent(c);
            if (p.getDuration) setDuration(p.getDuration() || 0);
            if (endRef.current && c >= endRef.current) { p.pauseVideo(); endRef.current = null; }
          }
        } catch (_e) {}
      }, 250);
    });
    return () => {
      destroyed = true;
      clearInterval(poll);
      try { playerRef.current?.destroy?.(); } catch (_e) {}
      playerRef.current = null;
    };
  }, [videoId]);

  const t = () => { try { return Math.round((playerRef.current?.getCurrentTime?.() || 0) * 10) / 10; } catch (_e) { return 0; } };

  const preview = () => {
    const p = playerRef.current;
    if (!p) return;
    endRef.current = Number(end) || null;
    try { p.seekTo(Number(start) || 0, true); p.playVideo(); } catch (_e) {}
  };

  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <div ref={hostRef} className="h-full w-full" />
      </div>
      <MarkerBar current={current} duration={duration} start={start} end={end}
        onPreview={preview} onIn={() => setStart(t())} onOut={() => setEnd(t())} />
    </>
  );
}

// Veo has no player JS API — the user scrubs in the embed and types the timestamps.
function VeoMarker({ externalId }) {
  return (
    <>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe src={`https://app.veo.co/matches/${externalId}/embed`} className="h-full w-full" allowFullScreen title="veo" />
      </div>
      <p className="mt-3 text-xs text-slate-400">Scrub the Veo player to your moment, then enter the start and end seconds below.</p>
    </>
  );
}

export default function ManualClipper({ project, games, sources, reload, defaultCategory, trigger }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ video_source_id: "", category: defaultCategory || "buckets", start: 0, end: 8, description: "" });

  const videoOptions = sources.filter((s) => s.status === "ready" || s.status === "error");
  const selected = sources.find((s) => s.id === form.video_source_id);
  const valid = !!form.video_source_id && Number(form.end) > Number(form.start);

  const save = async () => {
    if (!valid) return;
    const src = sources.find((s) => s.id === form.video_source_id);
    const start = Number(form.start) || 0;
    const end = Number(form.end) || start + 8;
    await base44.entities.Clip.create({
      project_id: project.id,
      game_id: src?.game_id || "",
      video_source_id: form.video_source_id,
      category: form.category,
      description: form.description || "Manually clipped",
      start_seconds: start,
      end_seconds: end,
      event_seconds: start + (end - start) / 2,
      confidence: 100,
      status: "accepted",
      order_index: 999,
      detection_source: "manual",
      clip_url: src?.file_url || "",
      processing_status: "ready",
    });
    setOpen(false);
    setForm({ video_source_id: "", category: defaultCategory || "buckets", start: 0, end: 8, description: "" });
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-white/10 hover:bg-white/20">
            <Scissors className="mr-1.5 h-3.5 w-3.5" /> Clip manually
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-white/10 bg-slate-950 text-slate-100">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">CLIP MANUALLY</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {videoOptions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              No video sources are ready yet. Add a game with footage first.
            </p>
          ) : (
            <>
              <div>
                <Label className="text-xs text-slate-400">Video source</Label>
                <Select value={form.video_source_id} onValueChange={(v) => setForm({ ...form, video_source_id: v })}>
                  <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue placeholder="Choose a video" /></SelectTrigger>
                  <SelectContent>
                    {videoOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {(games.find((g) => g.id === s.game_id)?.name || "Game") + " — " + (s.title || s.source_type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selected && (
                <div className="rounded-2xl bg-black/30 p-3">
                  {selected.source_type === "file" && (
                    <FileMarker src={selected.file_url} start={form.start} end={form.end}
                      setStart={(t) => setForm((f) => ({ ...f, start: t }))}
                      setEnd={(t) => setForm((f) => ({ ...f, end: t }))} />
                  )}
                  {selected.source_type === "youtube" && (
                    <YouTubeMarker videoId={selected.external_id} start={form.start} end={form.end}
                      setStart={(t) => setForm((f) => ({ ...f, start: t }))}
                      setEnd={(t) => setForm((f) => ({ ...f, end: t }))} />
                  )}
                  {selected.source_type === "veo" && <VeoMarker externalId={selected.external_id} />}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-xs text-slate-400">Start (s)</Label>
                  <Input type="number" step="0.1" className="mt-1 border-white/10 bg-white/5" value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">End (s)</Label>
                  <Input type="number" step="0.1" className="mt-1 border-white/10 bg-white/5" value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Description</Label>
                <Input className="mt-1 border-white/10 bg-white/5" value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={save} disabled={!valid}
                className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400 disabled:opacity-50">
                SAVE CLIP
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}