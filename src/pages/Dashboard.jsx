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

const CARD_TONES = ["bg-paper", "bg-sun", "bg-rose", "bg-sage", "bg-paper", "bg-flame text-paper"];

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
            to: me?.email, subject: "Welcome to PROSPECT",
            body: `Hi ${name},\n\nYour PROSPECT portfolio has been created. Complete your profile, upload a game, and the AI will detect your buckets, rebounds, blocks and shooting — then build your highlight tapes automatically.\n\nOpen your dashboard to get started.`,
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
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-flame" />
      </div>
    );
  }
  if (!project) {
    return <div className="py-20 text-center text-ink/50">Could not load your portfolio. Try refreshing.</div>;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (project.player_name || "").split(" ")[0] || "Player";

  const stats = [
    { label: "Games", value: games.length, icon: Film, tone: 0 },
    { label: "Processing", value: processing.length, icon: Loader2, tone: 1 },
    { label: "Accepted clips", value: accepted.length, icon: Scissors, tone: 2 },
    { label: "Tapes ready", value: tapes.filter((t) => t.status === "ready").length, icon: Film, tone: 3 },
    { label: "Portfolio views", value: views, icon: Eye, tone: 4 },
    { label: "New inquiries", value: newInquiries, icon: Mail, tone: 5 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* Greeting hero */}
      <div className="animate-slide-up">
        <p className="label-xs text-flame">{greeting},</p>
        <h1 className="mt-2 display-xl text-5xl leading-[0.85] sm:text-7xl">
          {firstName}.
        </h1>
        <p className="mt-4 max-w-md text-ink/65">
          {ready ? "Your portfolio is share-ready. Keep it fresh." : "There's work to do — finish your profile and drop your footage."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => navigate(`/project/${project.id}`)} className="rounded-none bg-ink text-paper hover:bg-ink-soft">
            Open project <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a href={portfolioLink(project)} target="_blank" rel="noreferrer">
            <Button variant="outline" className="rounded-none border-ink/20 bg-transparent text-ink hover:bg-ink hover:text-paper">
              <Eye className="mr-2 h-4 w-4" /> View portfolio
            </Button>
          </a>
          <SharePortfolioButton project={project} label="Share" />
        </div>
      </div>

      {/* Profile completion — bold block */}
      <div className="mt-12 grid gap-5 border-t-2 border-ink/15 pt-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="label-xs text-ink/50">Profile completion</p>
            {ready ? (
              <span className="label-xs inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-ink">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready to share
              </span>
            ) : (
              <span className="label-xs inline-flex items-center gap-1.5 rounded-full bg-flame px-3 py-1 text-paper">
                <AlertCircle className="h-3.5 w-3.5" /> Complete profile
              </span>
            )}
          </div>
          <p className="mt-4 font-display text-7xl leading-none sm:text-8xl">{completion}<span className="text-flame">%</span></p>
          <Progress value={completion} className="mt-5 h-1.5 bg-ink/10" />
          {missing.length > 0 && (
            <p className="mt-4 text-sm text-ink/55">Missing: {missing.slice(0, 6).join(", ")}{missing.length > 6 ? "…" : ""}</p>
          )}
        </div>
        <div className="md:col-span-5">
          <div className="flex h-full flex-col justify-between rounded-none border border-ink/15 bg-ink p-6 text-paper">
            <p className="label-xs text-sun">The season</p>
            <p className="mt-3 font-display text-3xl uppercase leading-tight">{project.team_name || "Unassigned"}</p>
            <p className="mt-1 text-sm text-paper/60">{project.position || "—"}{project.jersey_number ? `  ·  #${project.jersey_number}` : ""}</p>
            <Link to={`/project/${project.id}`} className="label-sm mt-6 inline-flex items-center gap-2 text-sun hover:text-paper">
              Edit profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Oversized statistics */}
      <div className="mt-16">
        <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-4">
          <h2 className="display-xl text-3xl sm:text-5xl">By the numbers</h2>
          <span className="label-xs text-ink/50">Live</span>
        </div>
        <div className="mt-6 grid gap-px bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className={`flex flex-col justify-between p-7 ${CARD_TONES[s.tone]}`}>
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 opacity-70" />
                <span className="label-xs opacity-60">{s.label}</span>
              </div>
              <p className="mt-6 font-display text-6xl leading-none sm:text-7xl">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Highlight categories */}
      <div className="mt-16">
        <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-4">
          <h2 className="display-xl text-3xl sm:text-5xl">Highlights</h2>
          <Link to={`/project/${project.id}?tab=clips`} className="label-sm inline-flex items-center gap-2 text-flame hover:text-ink">
            All clips <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const tones = ["bg-paper", "bg-sun", "bg-rose", "bg-sage"];
            return (
              <Link key={c.key} to={`/project/${project.id}?tab=${c.key}`}
                className={`group flex flex-col justify-between p-6 ${tones[i % tones.length]} transition hover:-translate-y-1`}>
                <span className="text-3xl">{c.emoji}</span>
                <p className="mt-6 font-display text-6xl leading-none">{clips.filter((x) => x.category === c.key).length}</p>
                <p className="label-xs mt-2 text-ink/60">{c.label}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}