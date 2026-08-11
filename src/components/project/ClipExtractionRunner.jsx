import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Film } from "lucide-react";
import { extractClipFile, grabFrame, canvasToBlob } from "@/lib/clipExtractor";
import { fmtTime } from "@/lib/categories";
import { useToast } from "@/components/ui/use-toast";

// Runs the real browser-side extraction for every clip that is waiting to be
// extracted (processing_status === "extracting", no real clip_url yet, source is
// an uploaded file). Produces genuine video files, uploads them, and marks each
// clip READY only after the file is stored. This is the "creating clips" stage.
export default function ClipExtractionRunner({ clips, sources, reload }) {
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);
  const { toast } = useToast();

  const fileSourceFor = (c) =>
    sources.find((s) => s.id === c.video_source_id && s.source_type === "file" && s.file_url);
  const pending = clips.filter(
    (c) => c.processing_status === "extracting" && (c.clip_url || "").length === 0 && fileSourceFor(c)
  );

  const run = async () => {
    if (running || !pending.length) return;
    setRunning(true);
    setFailed(0);
    setDone(0);
    let ok = 0;
    let bad = 0;
    for (const clip of pending.slice()) {
      setCurrent(clip);
      setProgress(0);
      const source = fileSourceFor(clip);
      try {
        const { blob } = await extractClipFile({
          sourceUrl: source.file_url,
          start: clip.start_seconds,
          end: clip.end_seconds,
          onProgress: (p) => setProgress(Math.round(p * 100)),
        });
        const file = new File([blob], `clip_${clip.id}.webm`, { type: blob.type });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        let thumbnail_url = clip.thumbnail_url || "";
        try {
          const { canvas } = await grabFrame(source.file_url, (clip.start_seconds + clip.end_seconds) / 2);
          const tb = await canvasToBlob(canvas, "image/jpeg", 0.8);
          const thumbFile = new File([tb], `thumb_${clip.id}.jpg`, { type: "image/jpeg" });
          const up = await base44.integrations.Core.UploadFile({ file: thumbFile });
          thumbnail_url = up.file_url;
        } catch (_e) { /* thumbnail is best-effort */ }

        await base44.entities.Clip.update(clip.id, {
          clip_url: file_url,
          thumbnail_url,
          processing_status: "ready",
          extraction_error: "",
        });
        ok += 1;
      } catch (e) {
        bad += 1;
        await base44.entities.Clip.update(clip.id, {
          processing_status: "failed",
          extraction_error: (e && e.message) || "Extraction failed in the browser.",
        }).catch(() => {});
      }
      setDone((d) => d + 1);
    }
    setCurrent(null);
    setProgress(0);
    setRunning(false);
    setFailed(bad);
    await reload();
    if (bad === 0)
      toast({ title: `${ok} clip${ok > 1 ? "s" : ""} ready`, description: "Real video files extracted and saved." });
    else
      toast({ title: `${ok} ready, ${bad} failed`, description: "Some clips could not be extracted — click Retry on each.", variant: "destructive" });
  };

  if (!pending.length && !running) return null;

  return (
    <div className="rounded-3xl border border-orange-500/25 bg-orange-500/[0.06] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Film className="h-5 w-5 text-orange-400" />
          <div>
            <p className="text-sm font-medium">Extract real clip files</p>
            <p className="text-xs text-slate-400">
              {pending.length} clip{pending.length > 1 ? "s" : ""} ready to extract in your browser — keep this tab open.
            </p>
          </div>
        </div>
        <Button onClick={run} disabled={running} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
          {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> EXTRACTING…</> : "EXTRACT CLIPS"}
        </Button>
      </div>
      {running && current && (
        <div className="mt-4 rounded-2xl bg-black/30 p-4">
          <p className="text-xs text-slate-300">{current.description || current.category}</p>
          <p className="text-[11px] text-slate-500">{fmtTime(current.start_seconds)} → {fmtTime(current.end_seconds)} · {progress}%</p>
          <Progress value={progress} className="mt-2 h-1.5 bg-white/10" />
          <p className="mt-2 text-[10px] text-slate-500">{done} done · real-time capture in progress</p>
        </div>
      )}
      {!running && failed > 0 && (
        <p className="mt-3 text-xs text-rose-300">{failed} clip(s) failed to extract — use Retry on each clip.</p>
      )}
    </div>
  );
}