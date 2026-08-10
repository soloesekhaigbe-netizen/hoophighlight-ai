import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { Plus, Trash2, Loader2, Upload } from "lucide-react";

const FIELDS = [
  ["player_name", "Player name *", "Solomon Esekhaigbe"],
  ["jersey_number", "Jersey number *", "23"],
  ["team_name", "Team *", "Riverside Academy"],
  ["season", "Season", "2026"],
  ["position", "Position *", "Center"],
  ["height", "Height", "6'9\""],
];

export default function NewProjectDialog({ onCreated, trigger }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadPhotos = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setPhotos((p) => [...p, ...urls]);
    setUploading(false);
  };

  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!form.player_name || !form.jersey_number || !form.team_name || !form.position) return;
    setSaving(true);
    const project = await base44.entities.Project.create({
      ...form,
      reference_photos: photos,
      intro_enabled: true,
      outro_enabled: true,
      identity_threshold: 90,
      calibrated: false,
    });
    setSaving(false);
    setOpen(false);
    setForm({});
    setPhotos([]);
    onCreated?.(project);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">NEW PLAYER PROJECT</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([k, label, ph]) => (
            <div key={k} className={["season", "height"].includes(k) ? "" : "sm:col-span-2"}>
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

        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-400">Player reference photos (front, side, game, different jersey)</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
                <Image src={url} alt={`ref ${i + 1}`} className="h-full w-full object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-rose-300 opacity-0 transition group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 text-slate-400 hover:border-orange-500/50 hover:text-orange-300">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-[10px] tracking-widest">{uploading ? "UPLOADING" : "ADD PHOTO"}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => uploadPhotos(Array.from(e.target.files))} />
            </label>
          </div>
        </div>

        <Button onClick={submit} disabled={saving || uploading || !form.player_name || !form.jersey_number || !form.team_name || !form.position}
          className="mt-2 w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
          {saving ? "CREATING..." : "CREATE PROJECT"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}