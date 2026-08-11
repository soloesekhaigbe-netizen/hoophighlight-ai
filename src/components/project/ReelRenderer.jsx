import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, AlertTriangle, Music, Zap } from "lucide-react";
import { renderReel } from "@/lib/reelRenderer";
import { useToast } from "@/components/ui/use-toast";

// Renders a reel's clips into one fast-paced, seamless video file with optional
// music, entirely in the browser. No external service or API key.
const PACES = [
  { key: "fast", label: "Fast", cap: 3.5 },
  { key: "hype", label: "Hype", cap: 2.5 },
  { key: "full", label: "Full", cap: 0 },
];

export default function ReelRenderer({ open, onOpenChange, tape, clips, reload }) {
  const [state, setState] = useState("idle"); // idle | rendering | done | error
  const [prog, setProg] = useState({ clipIndex: 0, clipTotal: 1, clipProgress: 0, overall: 0 });
  const [renderedUrl, setRenderedUrl] = useState("");
  const [error, setError] = useState("");
  const [pace, setPace] = useState("fast");
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState("");
  const { toast } = useToast();

  const usable = (tape?.clip_ids || [])
    .map((id) => clips.find((c) => c.id === id))
    .filter((c) => c?.clip_url);

  const pickMusic = (file) => {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicFile(file);
    setMusicUrl(file ? URL.createObjectURL(file) : "");
  };

  const run = async () => {
    setState("rendering");
    setError("");
    setProg({ clipIndex: 0, clipTotal: usable.length, clipProgress: 0, overall: 0 });
    setRenderedUrl("");
    try {
      const cap = PACES.find((p) => p.key === pace)?.cap ?? 3.5;
      const { blob, duration } = await renderReel({
        clips: usable,
        musicUrl: musicUrl || undefined,
        maxClipSec: cap,
        onProgress: setProg,
      });
      const file = new File([blob], `reel_${tape.id}.webm`, { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.HighlightTape.update(tape.id, {
        video_url: file_url,
        export_mode: "rendered",
        duration_seconds: Math.round(duration),
      });
      setRenderedUrl(file_url);
      setState("done");
      toast({ title: "Reel rendered", description: "Fast-paced reel ready to download." });
      if (reload) await reload();
    } catch (e) {
      setState("error");
      setError(e?.message || "Rendering failed.");
    }
  };

  const reset = () => {
    setState("idle");
    setProg({ clipIndex: 0, clipTotal: usable.length, clipProgress: 0, overall: 0 });
    setRenderedUrl("");
    setError("");
  };

  const dl = renderedUrl || tape?.video_url;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 200); }}>
      <DialogContent className="max-w-lg border-white/10 bg-slate-950">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Render reel</DialogTitle>
          <DialogDescription className="text-slate-400">
            Seamless, fast-paced cut of all {usable.length} clip{usable.length !== 1 ? "s" : ""} with music — no pauses, no breaks.
            This records in real time — keep this tab open until it finishes.
          </DialogDescription>
        </DialogHeader>

        {state === "idle" && (
          <div className="space-y-4">
            {!usable.length && (
              <p className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No downloadable clip files in this reel. Clips from YouTube/Veo links can't be merged — extract real clip files first.
              </p>
            )}

            {/* Pace */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-slate-300">
                <Zap className="h-3.5 w-3.5 text-orange-400" /> EDIT PACE
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PACES.map((p) => (
                  <button key={p.key} onClick={() => setPace(p.key)}
                    className={`squircle-sm border px-3 py-2.5 text-[11px] font-semibold tracking-[0.14em] transition ${
                      pace === p.key ? "border-orange-500 bg-orange-500/15 text-orange-300" : "border-white/10 text-slate-400 hover:border-white/25"
                    }`}>
                    {p.label.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {pace === "full" ? "Each clip plays in full." : pace === "hype" ? "Snappy 2.5s per clip — maximum energy." : "Tight 3.5s per clip — balanced pace."}
              </p>
            </div>

            {/* Music */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-slate-300">
                <Music className="h-3.5 w-3.5 text-orange-400" /> MUSIC TRACK
              </div>
              <label className="flex cursor-pointer items-center gap-3 squircle border border-dashed border-white/15 p-3 hover:border-orange-500/50">
                <Music className="h-5 w-5 shrink-0 text-slate-500" />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">
                  {musicFile ? musicFile.name : "Add a track (.mp3 / .wav)"}
                </span>
                {musicFile && (
                  <button type="button" onClick={(e) => { e.preventDefault(); pickMusic(null); }}
                    className="text-[11px] text-slate-500 hover:text-rose-400">Remove</button>
                )}
                <input type="file" accept="audio/*" className="hidden"
                  onChange={(e) => pickMusic(e.target.files?.[0] || null)} />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Music is mixed into the final video with a smooth fade-out. No track = silent reel.
              </p>
            </div>

            <Button onClick={run} disabled={!usable.length} className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400">
              <Download className="mr-2 h-4 w-4" /> Render fast-paced reel
            </Button>
          </div>
        )}

        {state === "rendering" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
              Recording clip {prog.clipIndex + 1} of {prog.clipTotal}…
            </div>
            <Progress value={Math.round(prog.overall * 100)} className="h-2 bg-white/10" />
            <p className="text-[11px] text-slate-500">
              Real-time capture · {Math.round(prog.clipProgress * 100)}% through current clip
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Your reel is rendered as one video file.</p>
            <a href={dl} download={`reel_${tape?.id}.webm`} target="_blank" rel="noreferrer">
              <Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400">
                <Download className="mr-2 h-4 w-4" /> Download video
              </Button>
            </a>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-slate-400">
              Close
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <p className="flex gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </p>
            <Button onClick={run} variant="outline" className="w-full border-white/15 bg-transparent">
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}