import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { Crosshair, Loader2, UserCheck, UserX } from "lucide-react";
import { grabFrame, canvasToBlob } from "@/lib/clipExtractor";
import { useToast } from "@/components/ui/use-toast";

// Real player calibration. For an uploaded file the player picks a short window,
// the system grabs a real frame from the footage, sends it (plus the reference
// photos) to the vision model to locate the target player, and shows the frame to
// the player to confirm: "Yes — this is me" locks the identity and adds the frame
// to the reference photos; "No — find another" lets them adjust the window.
export default function PlayerCalibration({ project, sources, reload, trigger }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ start: 0, end: 15 });
  const [busy, setBusy] = useState(false);
  const [frameUrl, setFrameUrl] = useState("");
  const [verdict, setVerdict] = useState(null);
  const { toast } = useToast();

  const fileSources = sources.filter((s) => s.source_type === "file" && s.file_url && (s.status === "ready" || s.status === "error"));

  const grabCandidate = async () => {
    if (!form.video_source_id) return;
    setBusy(true);
    setVerdict(null);
    setFrameUrl("");
    try {
      const src = sources.find((s) => s.id === form.video_source_id);
      const mid = (Number(form.start) + Number(form.end)) / 2;
      const { canvas } = await grabFrame(src.file_url, mid);
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
      setFrameUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast({ title: "Could not grab frame", description: e?.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const checkIdentity = async () => {
    if (!frameUrl || !form.video_source_id) return;
    setBusy(true);
    try {
      const ref = project.reference_photos || [];
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: [
          "You are identifying ONE basketball player in a frame. The FIRST image is a frame from game footage.",
          `Target: name="${project.player_name || "?"}", jersey #${project.jersey_number || "?"}, team="${project.team_name || ""}".`,
          ref.length ? "Reference photos of the target are attached AFTER the frame." : "No reference photos provided.",
          "Based on jersey number, uniform, and body/face, is the target player clearly visible in this frame? Return JSON with visible (boolean), confidence (0-100), and note (short).",
        ].join("\n"),
        file_urls: [frameUrl, ...ref],
        model: "gemini_3_1_pro",
        response_json_schema: {
          type: "object",
          properties: { visible: { type: "boolean" }, confidence: { type: "number" }, note: { type: "string" } },
          required: ["visible", "confidence"],
        },
      });
      setVerdict(res || { visible: false, confidence: 0, note: "No response from model." });
    } catch (e) {
      setVerdict({ visible: false, confidence: 0, note: e?.message || "Model error." });
    }
    setBusy(false);
  };

  const confirmYes = async () => {
    if (!frameUrl) return;
    setBusy(true);
    try {
      // Save the confirmed frame as an additional reference photo.
      const blob = await (await fetch(frameUrl)).blob();
      const file = new File([blob], `calib_${Date.now()}.jpg`, { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Project.update(project.id, {
        calibrated: true,
        calibration_source_id: form.video_source_id,
        calibration_start: Number(form.start) || 0,
        calibration_end: Number(form.end) || 15,
        reference_photos: [...(project.reference_photos || []), file_url],
      });
      toast({ title: "Player calibrated", description: "Identity locked and frame saved as a reference photo." });
      setOpen(false);
      setVerdict(null);
      setFrameUrl("");
      reload?.();
    } catch (e) {
      toast({ title: "Could not save calibration", description: e?.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const findAnother = () => {
    setVerdict(null);
    setFrameUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setVerdict(null); setFrameUrl(""); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">CALIBRATE PLAYER</DialogTitle></DialogHeader>
        <p className="text-xs text-slate-400">
          Pick a short window where your player is clearly visible. The system grabs a real frame, checks it against your reference photos, and asks you to confirm the identity before processing.
        </p>

        {(project.reference_photos || []).length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(project.reference_photos || []).slice(0, 8).map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-white/10">
                <Image src={url} alt={`ref ${i}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div>
          <Label className="text-xs text-slate-400">Calibration footage</Label>
          <Select value={form.video_source_id || ""} onValueChange={(v) => { setForm({ ...form, video_source_id: v }); setFrameUrl(""); setVerdict(null); }}>
            <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue placeholder="Choose an uploaded video" /></SelectTrigger>
            <SelectContent>
              {fileSources.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">Upload footage first to calibrate.</p>}
              {fileSources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title || "Footage"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-400">Window start (s)</Label>
            <Input type="number" className="mt-1 border-white/10 bg-white/5" value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Window end (s)</Label>
            <Input type="number" className="mt-1 border-white/10 bg-white/5" value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </div>
        </div>

        <Button onClick={grabCandidate} disabled={busy || !form.video_source_id} variant="outline"
          className="border-white/15 bg-transparent hover:bg-white/10">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />} GRAB FRAME
        </Button>

        {frameUrl && (
          <div className="rounded-2xl bg-black/30 p-3">
            <img src={frameUrl} alt="candidate frame" className="aspect-video w-full rounded-xl object-cover" />
            {!verdict && (
              <Button onClick={checkIdentity} disabled={busy} className="mt-3 w-full bg-white/10 hover:bg-white/20">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} CHECK IDENTITY
              </Button>
            )}
            {verdict && (
              <div className="mt-3 space-y-3">
                <div className={`rounded-xl border p-3 text-xs ${verdict.visible ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
                  <p className="font-semibold">Target visible: {verdict.visible ? "YES" : "NO"} · {verdict.confidence}%</p>
                  {verdict.note && <p className="mt-1 text-slate-300">{verdict.note}</p>}
                </div>
                <p className="text-xs text-slate-400">Is this you? Confirm to lock the player identity for this game.</p>
                <div className="flex gap-2">
                  <Button onClick={confirmYes} disabled={busy} className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                    <UserCheck className="mr-1.5 h-4 w-4" /> YES — THIS IS ME
                  </Button>
                  <Button onClick={findAnother} variant="outline" className="border-white/15 bg-transparent hover:bg-white/10">
                    <UserX className="mr-1.5 h-4 w-4" /> NO — FIND ANOTHER
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}