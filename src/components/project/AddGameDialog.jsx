import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

export default function AddGameDialog({ projectId, onDone, trigger }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("veo");
  const [form, setForm] = useState({});
  const [urls, setUrls] = useState("");
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const list = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!list.length) { setErrors([{ url: "", error: "Paste at least one video link." }]); return; }
    setBusy(true);
    setErrors([]);
    const game = await base44.entities.Game.create({
      project_id: projectId,
      name: form.name || `Game ${new Date().toLocaleDateString()}`,
      game_date: form.game_date || undefined,
      opponent: form.opponent || "",
    });
    const res = await base44.functions.invoke("addVideoSource", { project_id: projectId, game_id: game.id, urls: list });
    const { created = [], rejected = [] } = res.data || {};
    setErrors(rejected);
    onDone?.();
    for (const s of created) {
      base44.functions.invoke("analyzeVideoSource", { video_source_id: s.id }).then(() => onDone?.());
    }
    setBusy(false);
    if (!rejected.length) { setOpen(false); setUrls(""); setForm({}); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">ADD GAME</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {[["veo", "VEO LINK"], ["youtube", "YOUTUBE LINK"]].map(([k, label]) => (
            <button key={k} onClick={() => setType(k)}
              className={`rounded-xl border px-4 py-4 text-xs font-semibold tracking-[0.18em] transition ${
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

        <div>
          <Label className="text-xs text-slate-400">
            {type === "veo" ? "Veo match links" : "YouTube links"} — one per line
          </Label>
          <Textarea rows={4} value={urls} onChange={(e) => setUrls(e.target.value)}
            placeholder={type === "veo" ? "https://app.veo.co/matches/..." : "https://www.youtube.com/watch?v=..."}
            className="mt-1 border-white/10 bg-white/5 font-mono text-xs" />
          <p className="mt-2 text-[11px] text-slate-500">
            Only use footage you're authorised to access. Private or restricted videos can't be processed.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
            {errors.map((e, i) => (
              <p key={i} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{e.url ? `${e.url}: ` : ""}{e.error}</p>
            ))}
          </div>
        )}

        <Button onClick={submit} disabled={busy}
          className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
          {busy ? "SUBMITTING..." : "START PROCESSING"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}