import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Film, Video, Scissors, Loader2 } from "lucide-react";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import { ACTIVE_STATUSES } from "@/lib/categories";

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
    <Icon className="h-5 w-5 text-orange-400" />
    <p className="mt-4 text-3xl font-semibold">{value}</p>
    <p className="mt-1 text-[11px] tracking-[0.2em] text-slate-500">{label}</p>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ projects: [], games: [], sources: [], clips: [], tapes: [] });

  const load = async () => {
    const [projects, games, sources, clips, tapes] = await Promise.all([
      base44.entities.Project.list("-created_date"),
      base44.entities.Game.list(),
      base44.entities.VideoSource.list(),
      base44.entities.Clip.list(),
      base44.entities.HighlightTape.list(),
    ]);
    setData({ projects, games, sources, clips, tapes });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { projects, games, sources, clips, tapes } = data;
  const processing = sources.filter((s) => ACTIVE_STATUSES.includes(s.status));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.34em] text-orange-400">HIGHLIGHT LAB</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Your projects</h1>
          <p className="mt-2 text-sm text-slate-400">Turn full game footage into recruiting-ready highlight tapes.</p>
        </div>
        <NewProjectDialog
          onCreated={(p) => navigate(`/project/${p.id}`)}
          trigger={
            <Button className="h-11 bg-orange-500 px-6 font-semibold tracking-[0.18em] text-slate-950 hover:bg-orange-400">
              <Plus className="mr-2 h-4 w-4" /> ADD PLAYER PROJECT
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={Film} label="PROJECTS" value={projects.length} />
        <Stat icon={Video} label="GAMES" value={games.length} />
        <Stat icon={Loader2} label="PROCESSING" value={processing.length} />
        <Stat icon={Scissors} label="DETECTED CLIPS" value={clips.length} />
        <Stat icon={Film} label="TAPES READY" value={tapes.filter((t) => t.status === "ready").length} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="mt-2 text-sm text-slate-400">Create a player project, then add Veo or YouTube game links.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const pGames = games.filter((g) => g.project_id === p.id);
            const pClips = clips.filter((c) => c.project_id === p.id);
            const pProc = sources.filter((s) => s.project_id === p.id && ACTIVE_STATUSES.includes(s.status));
            const pTapes = tapes.filter((t) => t.project_id === p.id && t.status === "ready");
            return (
              <Link key={p.id} to={`/project/${p.id}`}
                className="group rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-orange-500/40 hover:bg-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-lg font-semibold text-orange-300">
                    {p.jersey_number ? `#${p.jersey_number}` : "🏀"}
                  </div>
                  <div>
                    <p className="font-heading text-lg font-semibold">{p.player_name}</p>
                    <p className="text-xs text-slate-500">{p.team_name || "No team"} · {p.season || "—"}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[["GAMES", pGames.length], ["CLIPS", pClips.length], ["TAPES", pTapes.length]].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-white/[0.04] py-3">
                      <p className="text-xl font-semibold">{v}</p>
                      <p className="text-[10px] tracking-[0.2em] text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  {pProc.length ? `${pProc.length} video(s) processing…` : "All videos processed"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}