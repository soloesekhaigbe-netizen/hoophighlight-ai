import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Image } from "@/components/ui/image";
import { CATEGORIES, ACTIVE_STATUSES } from "@/lib/categories";

const FIELDS = [
  ["player_name", "Player name"], ["jersey_number", "Jersey number"], ["team_name", "Team"],
  ["season", "Season"], ["position", "Position"], ["height", "Height"],
];

export default function OverviewTab({ project, games, sources, clips, reload }) {
  const patch = async (data) => { await base44.entities.Project.update(project.id, data); reload(); };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-6">
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

      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
        <p className="text-[11px] tracking-[0.24em] text-slate-500">PLAYER IDENTIFICATION</p>
        {project.photo_url && (
          <Image src={project.photo_url} alt={project.player_name} className="mt-4 h-40 w-full rounded-2xl object-cover" />
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([k, label]) => (
            <div key={k}>
              <Label className="text-xs text-slate-400">{label}</Label>
              <Input className="mt-1 border-white/10 bg-white/5" defaultValue={project[k] || ""}
                onBlur={(e) => patch({ [k]: e.target.value })} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Player photo URL</Label>
            <Input className="mt-1 border-white/10 bg-white/5" defaultValue={project.photo_url || ""}
              onBlur={(e) => patch({ photo_url: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Appearance notes</Label>
            <Textarea rows={3} className="mt-1 border-white/10 bg-white/5" defaultValue={project.appearance_notes || ""}
              onBlur={(e) => patch({ appearance_notes: e.target.value })} />
          </div>
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          These details are sent to the analysis service so only this player's plays are detected — not every player on the floor.
        </p>
      </div>
    </div>
  );
}