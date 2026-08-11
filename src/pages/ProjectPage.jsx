import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import OverviewTab from "@/components/project/OverviewTab";
import GamesTab from "@/components/project/GamesTab";
import ClipsTab from "@/components/project/ClipsTab";
import ExportsTab from "@/components/project/ExportsTab";
import PortfolioTab from "@/components/project/PortfolioTab";
import CoachOutreachTab from "@/components/project/CoachOutreachTab";
import InquiriesTab from "@/components/project/InquiriesTab";
import AnalyticsTab from "@/components/project/AnalyticsTab";
import { CATEGORIES, ACTIVE_STATUSES } from "@/lib/categories";
import SharePortfolioButton from "@/components/SharePortfolioButton";

export default function ProjectPage() {
  const { id } = useParams();
  const [state, setState] = useState({ project: null, games: [], sources: [], clips: [], tapes: [], coaches: [], inquiries: [], events: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [project, games, sources, clips, tapes, coaches, inquiries, events] = await Promise.all([
      base44.entities.Project.get(id),
      base44.entities.Game.filter({ project_id: id }),
      base44.entities.VideoSource.filter({ project_id: id }),
      base44.entities.Clip.filter({ project_id: id }),
      base44.entities.HighlightTape.filter({ project_id: id }),
      base44.entities.Coach.filter({ project_id: id }),
      base44.entities.CoachInquiry.filter({ project_id: id }),
      base44.entities.PortfolioEvent.filter({ project_id: id }),
    ]);
    setState({ project, games, sources, clips, tapes, coaches, inquiries, events });
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const active = state.sources.some((s) => ACTIVE_STATUSES.includes(s.status));
    if (!active) return undefined;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [state.sources, load]);

  const { project, games, sources, clips, tapes, coaches, inquiries, events } = state;
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
    </div>
  );
  if (!project) return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-heading text-lg font-semibold text-slate-200">Project not found</p>
      <p className="text-sm text-slate-500">This project may have been removed.</p>
      <Link to="/dashboard" className="text-sm font-medium text-orange-400 hover:text-orange-300">Back to dashboard</Link>
    </div>
  );

  const shared = { project, games, sources, clips, tapes, coaches, inquiries, events, reload: load };

  return (
    <div className="space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] text-slate-500 hover:text-slate-300">
        <ArrowLeft className="h-4 w-4" /> DASHBOARD
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.3em] text-orange-400">
            {[project.team_name, project.season].filter(Boolean).join(" · ") || "PLAYER PROJECT"}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.player_name}{project.jersey_number ? <span className="text-slate-600"> #{project.jersey_number}</span> : null}
          </h1>
        </div>
        <SharePortfolioButton project={project} label="Share portfolio" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex w-full gap-1 overflow-x-auto bg-white/5 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[["overview", "OVERVIEW"], ["games", "GAMES"], ["clips", "CLIPS"],
            ...CATEGORIES.map((c) => [c.key, c.label]), ["exports", "EXPORTS"],
            ["portfolio", "PORTFOLIO"], ["outreach", "OUTREACH"], ["inquiries", "INQUIRIES"], ["analytics", "ANALYTICS"]].map(([v, l]) => (
            <TabsTrigger key={v} value={v}
              className="shrink-0 whitespace-nowrap text-[11px] tracking-[0.18em] data-[state=active]:bg-orange-500 data-[state=active]:text-slate-950">
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
          <TabsContent value="portfolio"><PortfolioTab {...shared} /></TabsContent>
          <TabsContent value="outreach"><CoachOutreachTab {...shared} /></TabsContent>
          <TabsContent value="inquiries"><InquiriesTab {...shared} /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab {...shared} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}