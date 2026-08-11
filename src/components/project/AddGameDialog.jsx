import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Upload, CheckCircle2, FileVideo } from "lucide-react";

export default function AddGameDialog({ projectId, onDone, trigger }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("file");
  const [form, setForm] = useState({});
  const [urls, setUrls] = useState("");
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  // Background upload: kicks off the moment a file is picked, runs in parallel
  // with the user filling in game details, so submit becomes near-instant.
  const [uploadState, setUploadState] = useState(null); // null | 'uploading' | 'ready' | 'error'
  const uploadPromiseRef = useRef(null);
  const fileUrlRef = useRef(null);

  const pickFile = (file) => {
    setUploadFile(file);
    setErrors([]);
    if (!file) { uploadPromiseRef.current = null; fileUrlRef.current = null; setUploadState(null); return; }
    setUploadState("uploading");
    uploadPromiseRef.current = (async () => {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        fileUrlRef.current = file_url;
        setUploadState("ready");
        return file_url;
      } catch (e) {
        setUploadState("error");
        uploadPromiseRef.current = null;
        throw e;
      }
    })();
  };

  const start = async (fileUrl, linkList) => {
    const game = await base44.entities.Game.create({
      project_id: projectId,
      name: form.name || `Game ${new Date().toLocaleDateString()}`,
      game_date: form.game_date || undefined,
      opponent: form.opponent || "",
      competition: form.competition || "",
      venue: form.venue || "",
      team: form.team || "",
    });
    const res = await base44.functions.invoke("addVideoSource", {
      project_id: projectId, game_id: game.id,
      urls: linkList, file_url: fileUrl, title: uploadFile?.name
    });
    const { created = [], rejected = [] } = res?.data || res || {};
    setErrors(rejected);
    onDone?.();
    for (const s of created) {
      base44.functions.invoke("analyzeVideoSource", { video_source_id: s.id }).then(() => onDone?.()).catch(() => {});
    }
    if (!rejected.length) { setOpen(false); setUrls(""); setForm({}); setUploadFile(null); }
  };

  const submit = async () => {
    setErrors([]);
    setBusy(true);
    try {
      if (type === "file") {
        if (!uploadFile) { setErrors([{ url: "", error: "Choose a video file to upload." }]); return; }
        // Await the background upload if it's still running; otherwise reuse the result.
        let fileUrl = fileUrlRef.current;
        if (uploadPromiseRef.current) {
          try { fileUrl = await uploadPromiseRef.current; }
          catch (e) { setErrors([{ url: "", error: e?.message || "Upload failed. Please try again." }]); return; }
        }
        if (!fileUrl) { setErrors([{ url: "", error: "Upload failed. Please try again." }]); return; }
        await start(fileUrl, null);
        return;
      }
      const list = urls.split("\n").map((u) => u.trim()).filter(Boolean);
      if (!list.length) { setErrors([{ url: "", error: "Paste at least one video link." }]); return; }
      await start(null, list);
    } catch (e) {
      setErrors([{ url: "", error: e?.message || "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setUploadFile(null); setUploadState(null); uploadPromiseRef.current = null; fileUrlRef.current = null; setErrors([]); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">ADD GAME</DialogTitle></DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {[["file", "UPLOAD FILE"], ["veo", "VEO LINK"], ["youtube", "YOUTUBE"]].map(([k, label]) => (
            <button key={k} onClick={() => setType(k)}
              className={`squircle-sm border px-3 py-3 text-[11px] font-semibold tracking-[0.16em] transition ${
                type === k ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-foreground/55 hover:border-white/25"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Label className="text-xs text-foreground/55">Game name</Label>
            <Input className="mt-1 " value={form.name || ""} placeholder="Regional Semi-Final"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-foreground/55">Opponent</Label>
            <Input className="mt-1 " value={form.opponent || ""}
              onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-foreground/55">Date</Label>
            <Input type="date" className="mt-1 " value={form.game_date || ""}
              onChange={(e) => setForm({ ...form, game_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-foreground/55">Team</Label>
            <Input className="mt-1 " value={form.team || ""} placeholder="Titans"
              onChange={(e) => setForm({ ...form, team: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-foreground/55">Competition</Label>
            <Input className="mt-1 " value={form.competition || ""} placeholder="Premier League"
              onChange={(e) => setForm({ ...form, competition: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-foreground/55">Venue</Label>
            <Input className="mt-1 " value={form.venue || ""} placeholder="Northampton"
              onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
        </div>

        {type === "file" ? (
          <div>
            <Label className="text-xs text-foreground/55">Upload game footage (.mp4 / .webm)</Label>
            {uploadState === "uploading" || uploadState === "ready" ? (
              <div className="mt-2 squircle border border-white/10 glass p-4">
                <div className="flex items-center gap-3">
                  {uploadState === "uploading"
                    ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                    : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
                  <FileVideo className="h-5 w-5 shrink-0 text-foreground/45" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground/85">{uploadFile?.name}</p>
                    <p className={`text-[11px] ${uploadState === "ready" ? "text-emerald-400" : "text-primary"}`}>
                      {uploadState === "ready" ? "Uploaded — ready to process" : "Uploading in background…"}
                    </p>
                  </div>
                  <button type="button" onClick={() => pickFile(null)}
                    className="text-[11px] text-foreground/45 hover:text-rose-400">Remove</button>
                </div>
                <label className="mt-2 inline-block cursor-pointer text-[11px] font-semibold tracking-[0.14em] text-foreground/55 hover:text-primary">
                  Choose a different file
                  <input type="file" accept="video/*" className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 squircle border border-dashed border-white/15 p-8 text-center hover:border-primary/50">
                {uploadState === "error" ? <AlertTriangle className="h-6 w-6 text-rose-400" /> : <Upload className="h-6 w-6 text-foreground/55" />}
                <span className="text-sm text-foreground/70">
                  {uploadState === "error" ? "Upload failed — try again" : "Click to choose a video file"}
                </span>
                <span className="text-[11px] text-foreground/45">
                  Upload starts instantly — fill in the details while it uploads.
                </span>
                <input type="file" accept="video/*" className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-xs text-foreground/55">
              {type === "veo" ? "Veo match links" : "YouTube links"} — one per line
            </Label>
            <Textarea rows={4} value={urls} onChange={(e) => setUrls(e.target.value)}
              placeholder={type === "veo" ? "https://app.veo.co/matches/..." : "https://www.youtube.com/watch?v=..."}
              className="mt-1  font-mono text-xs" />
            <p className="mt-2 text-[11px] text-foreground/45">
              Links try automatic AI analysis first — add clips manually if none are detected.
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-2 squircle-sm border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {errors.map((e, i) => (
              <p key={i} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{e.url ? `${e.url}: ` : ""}{e.error}</p>
            ))}
          </div>
        )}

        <Button onClick={submit} disabled={busy || (type === "file" && uploadState === "uploading" && !uploadFile)}
          className="w-full">
          {busy ? "PROCESSING..." : type === "file" && uploadState === "uploading" ? "UPLOADING… (then process)" : "START PROCESSING"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}