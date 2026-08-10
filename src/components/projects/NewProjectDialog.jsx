import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELDS = [
  ["player_name", "Player name *", "Solomon Esekhaigbe"],
  ["jersey_number", "Jersey number", "23"],
  ["team_name", "Team", "Riverside Academy"],
  ["season", "Season", "2026"],
  ["position", "Position", "Center"],
  ["height", "Height", "6'9\""],
  ["photo_url", "Player photo URL (optional)", "https://..."],
];

export default function NewProjectDialog({ onCreated, trigger }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.player_name) return;
    setSaving(true);
    const project = await base44.entities.Project.create({ ...form, intro_enabled: true, outro_enabled: true });
    setSaving(false);
    setOpen(false);
    setForm({});
    onCreated?.(project);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">NEW PLAYER PROJECT</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([k, label, ph]) => (
            <div key={k} className={k === "photo_url" ? "sm:col-span-2" : ""}>
              <Label className="text-xs text-slate-400">{label}</Label>
              <Input value={form[k] || ""} placeholder={ph} onChange={(e) => set(k, e.target.value)}
                className="mt-1 border-white/10 bg-white/5" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Appearance notes (helps identify the player)</Label>
            <Textarea value={form.appearance_notes || ""} onChange={(e) => set("appearance_notes", e.target.value)}
              placeholder="White jersey, sleeve on left arm, headband, tallest player on the floor"
              className="mt-1 border-white/10 bg-white/5" />
          </div>
        </div>
        <Button onClick={submit} disabled={saving || !form.player_name}
          className="mt-2 w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
          {saving ? "CREATING..." : "CREATE PROJECT"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}