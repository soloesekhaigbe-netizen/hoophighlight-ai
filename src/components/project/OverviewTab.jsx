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
  const completion = profileCompletion(project);
  const missing = completionMissing(project);
  const processingCount = sources.filter((s) => ACTIVE_STATUSES.includes(s.status)).length;

  return (
    <div className="space-y-6">
      {/* Completion + summary strip */}
      <div className="glass squircle-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-xs text-primary">Profile completion</p>
          <p className="label-xs text-foreground/45">{completion}% · {missing.length} missing</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${completion}%` }} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Games", games.length], ["Videos", sources.length], ["Processing", processingCount], ["Clips", clips.length]].map(([l, v]) => (
            <div key={l} className="rounded-[0.9rem] bg-white/[0.04] p-4">
              <p className="font-display text-3xl leading-none">{v}</p>
              <p className="mt-2 label-xs text-foreground/45">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Player identification */}
        <div className="glass squircle-lg p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="label-xs text-foreground/50">Player identification</p>
            {project.calibrated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 label-xs text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> Calibrated
              </span>
            ) : (
              <PlayerCalibration project={project} sources={sources} reload={reload}
                trigger={<Button size="sm"><Crosshair className="mr-1.5 h-3.5 w-3.5" /> Calibrate</Button>} />
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([k, label]) => (
              <div key={k}>
                <Label className="label-xs text-foreground/50">{label}</Label>
                <Input className="mt-1.5" defaultValue={project[k] || ""}
                  onBlur={(e) => patch({ [k]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="label-xs text-foreground/50">Appearance notes</Label>
              <Textarea rows={2} className="mt-1.5" defaultValue={project.appearance_notes || ""}
                onBlur={(e) => patch({ appearance_notes: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Reference photos */}
        <div className="glass squircle-lg p-6">
          <p className="label-xs text-foreground/50">Reference photos</p>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-[0.9rem] border border-white/10">
                <Image src={url} alt={`ref ${i + 1}`} className="h-full w-full object-cover" />
                <button onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-background/70 p-1.5 text-destructive opacity-0 transition group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[0.9rem] border border-dashed border-white/15 text-foreground/45 transition hover:border-primary/50 hover:text-primary">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="label-xs">{uploading ? "…" : "Add"}</span>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => addPhotos(Array.from(e.target.files))} />
            </label>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glass squircle-lg p-6">
          <p className="label-xs text-foreground/50">Highlight categories</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="rounded-[0.9rem] bg-white/[0.04] p-4">
                <p className="text-2xl">{c.emoji}</p>
                <p className="mt-3 font-display text-3xl leading-none text-primary">{clips.filter((x) => x.category === c.key).length}</p>
                <p className="mt-2 label-xs text-foreground/45">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threshold + branding */}
        <div className="glass squircle-lg p-6">
          <p className="label-xs text-foreground/50">Auto-accept threshold</p>
          <div className="mt-4 flex items-center gap-4">
            <Slider value={[threshold]} min={50} max={99} step={1} onValueChange={(v) => patch({ identity_threshold: v[0] })}
              className="flex-1" />
            <span className="w-14 text-right font-display text-2xl text-primary">{threshold}%</span>
          </div>
          <p className="mt-3 text-xs text-foreground/55">
            Clips with identity confidence at or above this are auto-accepted. {identityVerdict(threshold - 1, threshold).text} at {threshold - 1}%.
          </p>

          <div className="my-6 h-px bg-white/10" />

          <p className="label-xs text-foreground/50">Tape branding</p>
          <div className="mt-4 space-y-4">
            {[["intro_enabled", "Intro screen"], ["outro_enabled", "Outro screen"]].map(([k, label]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm text-foreground/80">{label}</span>
                <Switch checked={project[k] !== false} onCheckedChange={(v) => patch({ [k]: v })} />
              </div>
            ))}
            <div>
              <Label className="label-xs text-foreground/50">Outro text</Label>
              <Input className="mt-1.5" defaultValue={project.outro_text || ""}
                placeholder="Contact: coach@school.edu" onBlur={(e) => patch({ outro_text: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}