import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { renderReel } from "@/lib/reelRenderer";
import { useToast } from "@/components/ui/use-toast";

// Renders a reel's clips into one downloadable video file, entirely in the
// browser. No external service or API key — same MediaRecorder engine as clip
// extraction.
export default function ReelRenderer({ open, onOpenChange, tape, clips, reload }) {
  const [state, setState] = useState("idle"); // idle | rendering | done | error
  const [prog, setProg] = useState({ clipIndex: 0, clipTotal: 1, clipProgress: 0, overall: 0 });
  const [renderedUrl, setRenderedUrl] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const usable = (tape?.clip_ids || [])
    .map((id) => clips.find((c) => c.id === id))
    .filter((c) => c?.clip_url);

  const run = async () => {
    setState("rendering");
    setError("");
    setProg({ clipIndex: 0, clipTotal: usable.length, clipProgress: 0, overall: 0 });
    setRenderedUrl("");
    try {
      const { blob, duration } = await renderReel({ clips: usable, onProgress: setProg });
      const file = new File([blob], `reel_${tape.id}.webm`, { type: blob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.HighlightTape.update(tape.id, {
        video_url: file_url,
        export_mode: "rendered",
        duration_seconds: Math.round(duration),
      });
      setRenderedUrl(file_url);
      setState("done");
      toast({ title: "Reel rendered", description: "One video file ready to download." });
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
            Combine all {usable.length} clip{usable.length !== 1 ? "s" : ""} into one downloadable video file.
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
            <Button onClick={run} disabled={!usable.length} className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400">
              <Download className="mr-2 h-4 w-4" /> Render one video file
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