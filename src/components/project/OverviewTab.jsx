import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { CATEGORIES, ACTIVE_STATUSES, identityVerdict } from "@/lib/categories";
import { profileCompletion, completionMissing } from "@/lib/portfolio";
import { Upload, Trash2, Loader2, Crosshair, BadgeCheck } from "lucide-react";
import PlayerCalibration from "@/components/project/PlayerCalibration";

const FIELDS = [
  ["player_name", "Player name"], ["jersey_number", "Jersey number"], ["team_name", "Team"],
  ["season", "Season"], ["position", "Position"], ["height", "Height"],
];

const notifiedComplete = new Set();

export default function OverviewTab({ project, games, sources, clips, reload }) {
  const [uploading, setUploading] = useState(false);
  const patch = async (data) => {
    await base44.entities.Project.update(project.id, data);
    reload();
    const next = { ...project, ...data };
    if (profileCompletion(next) >= 100 && project.email && !notifiedComplete.has(project.id)) {
      notifiedComplete.add(project.id);
      try {
        await base44.integrations.Core.SendEmail({
          to: project.email, subject: "Profile complete",
          body: `Hi ${project.player_name},\n\nYour recruiting profile is now complete. Share your portfolio link with college coaches to get noticed.`
        });
      } catch (_e) { /* best-effort */ }
    }
  };

  const photos = project.reference_photos || [];

  const addPhotos = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    await patch({ reference_photos: [...photos, ...urls] });
    setUploading(false);
  };
  const removePhoto = async (i) => {
    const next = photos.filter((_, idx) => idx !== i);
    await patch({ reference_photos: next });
  };

  const threshold = project.identity_threshold ?? 90;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.06] p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Profile completion — {profileCompletion(project)}%</p>
            <p className="text-xs text-slate-400">{completionMissing(project).length} field(s) missing</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${profileCompletion(project)}%` }} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[["GAMES", games.length], ["VIDEOS", sources.length],
            ["PROCESSING", sources.filter((s) => ACTIVE_STATUSES.includes(s.status)).length],
            ["CLIPS", clips.length]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <p className="text-3xl font-semibold">{v}</p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-500">{l}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div key={c.key} className={`rounded-2xl border border-white/5 p-5 ${c.bg}`}>
              <p className="text-2xl">{c.emoji}</p>
              <p className={`mt-3 text-2xl font-semibold ${c.accent}`}>{clips.filter((x) => x.category === c.key).length}</p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-400">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">TAPE BRANDING</p>
          <div className="mt-4 space-y-4">
            {[["intro_enabled", "Intro screen"], ["outro_enabled", "Outro screen"]].map(([k, label]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch checked={project[k] !== false} onCheckedChange={(v) => patch({ [k]: v })} />
              </div>
            ))}
            <div>
              <Label className="text-xs text-slate-400">Outro text</Label>
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={project.outro_text || ""}
                placeholder="Contact: coach@school.edu" onBlur={(e) => patch({ outro_text: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-[0.24em] text-slate-500">PLAYER IDENTIFICATION</p>
            {project.calibrated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-emerald-300">
                <BadgeCheck className="h-3.5 w-3.5" /> CALIBRATED
              </span>
            ) : (
              <PlayerCalibration project={project} sources={sources} reload={reload}
                trigger={<Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400"><Crosshair className="mr-1.5 h-3.5 w-3.5" /> Calibrate player</Button>} />
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([k, label]) => (
              <div key={k}>
                <Label className="text-xs text-slate-400">{label}</Label>
                <Input className="mt-1 border-white/10 bg-white/5" defaultValue={project[k] || ""}
                  onBlur={(e) => patch({ [k]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-400">Appearance notes</Label>
              <Textarea rows={2} className="mt-1 border-white/10 bg-white/5" defaultValue={project.appearance_notes || ""}
                onBlur={(e) => patch({ appearance_notes: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">REFERENCE PHOTOS</p>
          <div className="mt-4 grid grid-cols-4 gap-3">
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
              <span className="text-[10px] tracking-widest">{uploading ? "…" : "ADD"}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => addPhotos(Array.from(e.target.files))} />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">AUTO-ACCEPT THRESHOLD</p>
          <div className="mt-4 flex items-center gap-4">
            <Slider value={[threshold]} min={50} max={99} step={1} onValueChange={(v) => patch({ identity_threshold: v[0] })}
              className="flex-1" />
            <span className="w-14 text-right text-lg font-semibold text-orange-400">{threshold}%</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Clips with player identity confidence at or above this are auto-accepted. {identityVerdict(threshold - 1, threshold).text} at {threshold - 1}%.
          </p>
        </div>
      </div>
    </div>
  );
}