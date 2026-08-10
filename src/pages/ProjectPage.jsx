import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import OverviewTab from "@/components/project/OverviewTab";
import GamesTab from "@/components/project/GamesTab";
import ClipsTab from "@/components/project/ClipsTab";
import ExportsTab from "@/components/project/ExportsTab";
import { CATEGORIES, ACTIVE_STATUSES } from "@/lib/categories";

export default function ProjectPage() {
  const { id } = useParams();
  const [state, setState] = useState({ project: null, games: [], sources: [], clips: [], tapes: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [project, games, sources, clips, tapes] = await Promise.all([
      base44.entities.Project.get(id),
      base44.entities.Game.filter({ project_id: id }),
      base44.entities.VideoSource.filter({ project_id: id }),
      base44.entities.Clip.filter({ project_id: id }),
      base44.entities.HighlightTape.filter({ project_id: id }),
    ]);
    setState({ project, games, sources, clips, tapes });
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const active = state.sources.some((s) => ACTIVE_STATUSES.includes(s.status));
    if (!active) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [state.sources, load]);

  const { project, games, sources, clips, tapes } = state;
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!project) return <p className="text-sm text-slate-400">Project not found.</p>;

  const shared = { project, games, sources, clips, tapes, reload: load };

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-slate-500 hover:text-slate-300">
        <ArrowLeft className="h-4 w-4" /> DASHBOARD
      </Link>

      <div>
        <p className="text-[11px] tracking-[0.3em] text-orange-400">
          {[project.team_name, project.season].filter(Boolean).join(" · ") || "PLAYER PROJECT"}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">
          {project.player_name}{project.jersey_number ? <span className="text-slate-600"> #{project.jersey_number}</span> : null}
        </h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-white/5 p-1">
          {[["overview", "OVERVIEW"], ["games", "GAMES"], ["clips", "CLIPS"],
            ...CATEGORIES.map((c) => [c.key, c.label]), ["exports", "EXPORTS"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v}
              className="text-[11px] tracking-[0.18em] data-[state=active]:bg-orange-500 data-[state=active]:text-slate-950">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="overview"><OverviewTab {...shared} /></TabsContent>
          <TabsContent value="games"><GamesTab {...shared} /></TabsContent>
          <TabsContent value="clips"><ClipsTab {...shared} /></TabsContent>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.key} value={c.key}>
              <ClipsTab {...shared} lockedCategory={c.key} />
            </TabsContent>
          ))}
          <TabsContent value="exports"><ExportsTab {...shared} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}