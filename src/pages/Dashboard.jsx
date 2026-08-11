import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Film, Video, Loader2, Scissors, Mail, Eye, Share2, ArrowRight, CheckCircle2, AlertCircle,
} from "lucide-react";
import { ACTIVE_STATUSES, CATEGORIES } from "@/lib/categories";
import { profileCompletion, completionMissing, portfolioReady, portfolioLink } from "@/lib/portfolio";
import SharePortfolioButton from "@/components/SharePortfolioButton";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [data, setData] = useState({ project: null, games: [], sources: [], clips: [], tapes: [], inquiries: [], coaches: [], events: [] });

  const load = async () => {
    const projects = await base44.entities.Project.list("-created_date");
    let project = projects[0] || null;
    if (!project) {
      setCreating(true);
      try {
        const me = await base44.auth.me();
        const name = me?.full_name || "New Player";
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 26) || "player";
        const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        project = await base44.entities.Project.create({
          owner_user_id: me?.id || "",
          player_name: name, jersey_number: "0", team_name: "Unassigned", position: "Unassigned",
          email: me?.email || "", slug, is_public: true, show_email: false,
          identity_threshold: 90, intro_enabled: true, outro_enabled: true, calibrated: false,
        });
        try {
          await base44.integrations.Core.SendEmail({
            to: me?.email, subject: "Welcome to Highlight Lab",
            body: `Hi ${name},\n\nYour recruiting portfolio has been created. Complete your profile, upload a game, and the AI will detect your buckets, rebounds, blocks and shooting — then build your highlight tapes automatically.\n\nOpen your dashboard to get started.`,
          });
        } catch (_e) { /* email is best-effort */ }
      } catch (_e) { project = null; }
      setCreating(false);
    }
    if (!project) { setLoading(false); return; }
    const pid = project.id;
    const [games, sources, clips, tapes, inquiries, coaches, events] = await Promise.all([
      base44.entities.Game.filter({ project_id: pid }),
      base44.entities.VideoSource.filter({ project_id: pid }),
      base44.entities.Clip.filter({ project_id: pid }),
      base44.entities.HighlightTape.filter({ project_id: pid }),
      base44.entities.CoachInquiry.filter({ project_id: pid }),
      base44.entities.Coach.filter({ project_id: pid }),
      base44.entities.PortfolioEvent.filter({ project_id: pid }),
    ]);
    setData({ project, games, sources, clips, tapes, inquiries, coaches, events });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { project, games, sources, clips, tapes, inquiries, coaches, events } = data;
  const processing = sources.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const accepted = clips.filter((c) => c.status === "accepted");
  const completion = profileCompletion(project);
  const missing = completionMissing(project);
  const ready = portfolioReady(project, accepted);
  const views = events.filter((e) => e.event_type === "portfolio_view").length;
  const newInquiries = inquiries.filter((q) => q.status === "new").length;

  if (loading || creating) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-orange-400" />
      </div>
    );
  }
  if (!project) {
    return <div className="py-20 text-center text-slate-400">Could not load your portfolio. Try refreshing.</div>;
  }

  const stats = [
    [Film, "GAMES", games.length],
    [Loader2, "PROCESSING", processing.length],
    [Scissors, "ACCEPTED CLIPS", accepted.length],
    [Film, "TAPES READY", tapes.filter((t) => t.status === "ready").length],
    [Eye, "PORTFOLIO VIEWS", views],
    [Mail, "NEW INQUIRIES", newInquiries],
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.34em] text-orange-400">PLAYER DASHBOARD</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            {project.player_name}{project.jersey_number ? <span className="text-slate-500"> #{project.jersey_number}</span> : null}
          </h1>
          <p className="mt-2 text-sm text-slate-400">{project.team_name || "Unassigned"} · {project.position || "—"}</p>
        </div>
        <div className="flex gap-3">
          <SharePortfolioButton project={project} label="Share portfolio" />
          <a href={portfolioLink(project)} target="_blank" rel="noreferrer">
            <Button variant="outline" className="border-white/15"><Eye className="mr-2 h-4 w-4" /> View</Button>
          </a>
          <Button onClick={() => navigate(`/project/${project.id}`)} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
            Open project <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Profile completion</p>
            <p className="mt-1 text-xs text-slate-400">{completion}% — {ready ? "Portfolio is share-ready" : `${missing.length} fields missing`}</p>
          </div>
          {ready ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> READY TO SHARE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
              <AlertCircle className="h-3.5 w-3.5" /> COMPLETE PROFILE
            </span>
          )}
        </div>
        <Progress value={completion} className="mt-4 h-2 bg-white/10" />
        {missing.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">Missing: {missing.slice(0, 6).join(", ")}{missing.length > 6 ? "…" : ""}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition hover:border-orange-500/30">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/12 text-orange-400">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-heading text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-[11px] tracking-[0.2em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link key={c.key} to={`/project/${project.id}`} className={`rounded-2xl border border-white/5 p-5 transition hover:border-orange-500/40 ${c.bg}`}>
            <p className="text-2xl">{c.emoji}</p>
            <p className={`mt-3 text-2xl font-semibold ${c.accent}`}>{clips.filter((x) => x.category === c.key).length}</p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-400">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}