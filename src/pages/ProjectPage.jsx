import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
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
    <div className="flex min-h-[70vh] items-center justify-center bg-ink">
      <Loader2 className="h-8 w-8 animate-spin text-sun" />
    </div>
  );
  if (!project) return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-ink px-6 text-center text-paper">
      <p className="font-display text-3xl uppercase">Not found</p>
      <Link to="/dashboard" className="label-sm text-sun">Back to dashboard</Link>
    </div>
  );

  const shared = { project, games, sources, clips, tapes, coaches, inquiries, events, reload: load };
  const tabList = [
    ["overview", "Overview"], ["games", "Games"], ["clips", "Clips"],
    ...CATEGORIES.map((c) => [c.key, c.label]),
    ["exports", "Exports"], ["portfolio", "Portfolio"],
    ["outreach", "Outreach"], ["inquiries", "Inquiries"], ["analytics", "Analytics"],
  ];

  return (
    <div className="min-h-screen bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Link to="/dashboard" className="label-xs inline-flex items-center gap-2 text-paper/50 transition hover:text-sun">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        {/* Editorial studio hero */}
        <div className="relative mt-6 overflow-hidden rounded-none border border-white/10 bg-ink-soft p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[10rem] leading-none text-white/[0.06] sm:text-[16rem]">
            {project.jersey_number || "00"}
          </div>
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label-xs text-sun">
                {[project.team_name, project.season].filter(Boolean).join("  ·  ") || "Player project"}
              </p>
              <h1 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-7xl">
                {project.player_name}
              </h1>
              <p className="mt-4 label-sm text-paper/60">
                {project.position}{project.height ? `  ·  ${project.height}` : ""}{project.team_name ? `  ·  ${project.team_name}` : ""}
              </p>
            </div>
            <SharePortfolioButton project={project} label="Share portfolio" tone="light" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })} className="mt-8">
          <TabsList className="flex w-full gap-1 overflow-x-auto rounded-none border-b border-white/10 bg-transparent p-0 no-scrollbar">
            {tabList.map(([v, l]) => (
              <TabsTrigger key={v} value={v}
                className="shrink-0 whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-paper/55 transition data-[state=active]:border-sun data-[state=active]:bg-transparent data-[state=active]:text-sun data-[state=active]:shadow-none hover:text-paper">
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
    </div>
  );
}