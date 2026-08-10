import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Upload } from "lucide-react";

export default function AddGameDialog({ projectId, onDone, trigger }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("file");
  const [form, setForm] = useState({});
  const [urls, setUrls] = useState("");
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const start = async (fileUrl, linkList) => {
    const game = await base44.entities.Game.create({
      project_id: projectId,
      name: form.name || `Game ${new Date().toLocaleDateString()}`,
      game_date: form.game_date || undefined,
      opponent: form.opponent || "",
    });
    const res = await base44.functions.invoke("addVideoSource", {
      project_id: projectId, game_id: game.id,
      urls: linkList, file_url: fileUrl, title: uploadFile?.name
    });
    const { created = [], rejected = [] } = res.data || {};
    setErrors(rejected);
    onDone?.();
    for (const s of created) {
      base44.functions.invoke("analyzeVideoSource", { video_source_id: s.id }).then(() => onDone?.());
    }
    setBusy(false);
    if (!rejected.length) { setOpen(false); setUrls(""); setForm({}); setUploadFile(null); }
  };

  const submit = async () => {
    if (type === "file") {
      if (!uploadFile) { setErrors([{ url: "", error: "Choose a video file to upload." }]); return; }
      setBusy(true);
      setErrors([]);
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      setUploading(false);
      await start(file_url, null);
      return;
    }
    const list = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!list.length) { setErrors([{ url: "", error: "Paste at least one video link." }]); return; }
    setBusy(true);
    setErrors([]);
    await start(null, list);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">ADD GAME</DialogTitle></DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {[["file", "UPLOAD FILE"], ["veo", "VEO LINK"], ["youtube", "YOUTUBE"]].map(([k, label]) => (
            <button key={k} onClick={() => setType(k)}
              className={`rounded-xl border px-3 py-3 text-[11px] font-semibold tracking-[0.16em] transition ${
                type === k ? "border-orange-500 bg-orange-500/10 text-orange-300" : "border-white/10 text-slate-400 hover:border-white/25"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Label className="text-xs text-slate-400">Game name</Label>
            <Input className="mt-1 border-white/10 bg-white/5" value={form.name || ""} placeholder="Regional Semi-Final"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Opponent</Label>
            <Input className="mt-1 border-white/10 bg-white/5" value={form.opponent || ""}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Date</Label>
            <Input type="date" className="mt-1 border-white/10 bg-white/5" value={form.game_date || ""}
              onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
          </div>
        </div>

        {type === "file" ? (
          <div>
            <Label className="text-xs text-slate-400">Upload game footage (.mp4 / .webm)</Label>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-8 text-center hover:border-orange-500/50">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-orange-400" /> : <Upload className="h-6 w-6 text-slate-400" />}
              <span className="text-sm text-slate-300">
                {uploadFile ? uploadFile.name : "Click to choose a video file"}
              </span>
              <span className="text-[11px] text-slate-500">
                Uploaded footage is fully processed — real clip segments are extracted and played.
              </span>
              <input type="file" accept="video/*" className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-slate-400">
              {type === "veo" ? "Veo match links" : "YouTube links"} — one per line
            </Label>
            <Textarea rows={4} value={urls} onChange={(e) => setUrls(e.target.value)}
              placeholder={type === "veo" ? "https://app.veo.co/matches/..." : "https://www.youtube.com/watch?v=..."}
              className="mt-1 border-white/10 bg-white/5 font-mono text-xs" />
            <p className="mt-2 text-[11px] text-slate-500">
              YouTube/Veo links need a connected processing service for stored clip extraction. Upload the file directly for the full pipeline.
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {errors.map((e, i) => (
              <p key={i} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{e.url ? `${e.url}: ` : ""}{e.error}</p>
            ))}
          </div>
        )}

        <Button onClick={submit} disabled={busy || uploading}
          className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
          {busy || uploading ? "PROCESSING..." : "START PROCESSING"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}