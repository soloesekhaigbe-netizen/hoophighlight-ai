import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image } from "@/components/ui/image";
import { Crosshair, Loader2 } from "lucide-react";

export default function PlayerCalibration({ project, sources, reload, trigger }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ start: 0, end: 15 });
  const [busy, setBusy] = useState(false);

  const fileSources = sources.filter((s) => s.source_type === "file" || s.status === "ready");

  const calibrate = async () => {
    if (!form.video_source_id) return;
    setBusy(true);
    await base44.entities.Project.update(project.id, {
      calibrated: true,
      calibration_source_id: form.video_source_id,
      calibration_start: Number(form.start) || 0,
      calibration_end: Number(form.end) || 15,
    });
    setBusy(false);
    setOpen(false);
    reload?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="tracking-[0.16em]">CALIBRATE PLAYER</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-slate-400">
          Pick a short section of footage where your player is clearly visible. The system uses this to lock the
          target identity before processing the full game.
        </p>

        <div>
          <Label className="text-xs text-slate-400">Reference photos on file</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(project.reference_photos || []).map((url, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-white/10">
                <Image src={url} alt={`ref ${i}`} className="h-full w-full object-cover" />
              </div>
            ))}
            {(project.reference_photos || []).length === 0 && (
              <p className="col-span-4 text-xs text-slate-500">No reference photos yet — add some on the Overview tab.</p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-xs text-slate-400">Calibration footage</Label>
          <Select value={form.video_source_id || ""} onValueChange={(v) => setForm({ ...form, video_source_id: v })}>
            <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue placeholder="Choose a video" /></SelectTrigger>
            <SelectContent>
              {fileSources.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title || s.url || "Footage"}</SelectItem>
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

        <Button onClick={calibrate} disabled={busy || !form.video_source_id}
          className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
          {busy ? "CALIBRATING..." : "CONFIRM CALIBRATION"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}