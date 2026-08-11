import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import {
  Film, Loader2, Scissors, Mail, Eye, ArrowRight, CheckCircle2, AlertCircle,
  Upload, Camera, Sparkles, Play, ChevronRight, Star, RefreshCw,
} from "lucide-react";
import { ACTIVE_STATUSES, CATEGORIES, catMeta, fmtTime } from "@/lib/categories";
import { profileCompletion, completionMissing, portfolioReady } from "@/lib/portfolio";
import SharePortfolioButton from "@/components/SharePortfolioButton";
import AddGameDialog from "@/components/project/AddGameDialog";
import CreateReelDialog from "@/components/project/CreateReelDialog";
import StatusBadge from "@/components/StatusBadge";
import GlassCard from "@/components/glass/GlassCard";
import GlassStatCard from "@/components/glass/GlassStatCard";
import GlassBadge from "@/components/glass/GlassBadge";
import GlassAIPanel from "@/components/glass/GlassAIPanel";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [recordBusy, setRecordBusy] = useState(false);
  const [data, setData] = useState({ project: null, games: [], sources: [], clips: [], tapes: [], inquiries: [], events: [] });
  const recordRef = useRef(null);

  const load = async () => {
    let projects;
    try {
      projects = await base44.entities.Project.list("-created_date", 50);
    } catch (e) {
      console.warn("Dashboard project load failed:", e?.message);
      setLoading(false);
      return;
    }
    let project = projects[0] || null;
    if (!project) {
      setCreating(true);
      try {
        const me = await base44.auth.me();
        const name = me?.full_name || "New Player";
        const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 26) || "player";
        const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        project = await base44.entities.Project.create({
          owner_user_id: me?.id || "", player_name: name, jersey_number: "0", team_name: "Unassigned", position: "Unassigned",
          email: me?.email || "", slug, is_public: true, show_email: false,
          identity_threshold: 90, intro_enabled: true, outro_enabled: true, calibrated: false,
        });
        try {
          await base44.integrations.Core.SendEmail({
            to: me?.email, subject: "Welcome to PROSPECT",
            body: `Hi ${name},\n\nYour PROSPECT portfolio has been created. Complete your profile, upload a game, and we'll detect your buckets, rebounds, blocks and shooting — then build your highlight tapes automatically.\n\nOpen your dashboard to get started.`,
          });
        } catch (_e) {}
      } catch (_e) { project = null; }
      setCreating(false);
    }
    if (!project) { setLoading(false); return; }
    const pid = project.id;
    const safe = (p) => p.catch((e) => { console.warn("Dashboard load partial failure:", e?.message); return []; });
    const [games, sources, clips, tapes, inquiries, events] = await Promise.all([
      safe(base44.entities.Game.filter({ project_id: pid }, "-created_date", 500)),
      safe(base44.entities.VideoSource.filter({ project_id: pid }, "-created_date", 500)),
      safe(base44.entities.Clip.filter({ project_id: pid }, "-created_date", 500)),
      safe(base44.entities.HighlightTape.filter({ project_id: pid }, "-created_date", 500)),
      safe(base44.entities.CoachInquiry.filter({ project_id: pid }, "-created_date", 500)),
      safe(base44.entities.PortfolioEvent.filter({ project_id: pid }, "-created_date", 500)),
    ]);
    setData({ project, games, sources, clips, tapes, inquiries, events });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const active = data.sources.some((s) => ACTIVE_STATUSES.includes(s.status));
    if (!active) return undefined;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [data.sources]);

  // Native-like pull-to-refresh (must run on every render, before any early return).
  const { pull, refreshing } = usePullToRefresh(load);

  const onRecord = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const game = await base44.entities.Game.create({ project_id: data.project.id, name: `Recorded ${new Date().toLocaleDateString()}` });
      const res = await base44.functions.invoke("addVideoSource", { project_id: data.project.id, game_id: game.id, file_url, title: file.name });
      const created = res?.data?.created || res?.created || [];
      for (const s of created) base44.functions.invoke("analyzeVideoSource", { video_source_id: s.id }).catch(() => {});
      load();
    } catch (err) {
      alert("Could not record: " + (err?.message || "unknown error"));
    } finally {
      setRecordBusy(false);
      if (recordRef.current) recordRef.current.value = "";
    }
  };

  const { project, games, sources, clips, tapes, inquiries, events } = data;

  if (loading || creating) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!project) {
    return <div className="py-20 text-center text-foreground/50">Could not load your portfolio. Try refreshing.</div>;
  }

  const processing = sources.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const accepted = clips.filter((c) => c.status === "accepted");
  const completion = profileCompletion(project);
  const missing = completionMissing(project);
  const ready = portfolioReady(project, accepted);
  const views = events.filter((e) => e.event_type === "portfolio_view").length;
  const newInquiries = inquiries.filter((q) => q.status === "new").length;
  const reels = tapes.filter((t) => t.category === "mix").sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const recentGames = [...games].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")).slice(0, 4);
  const recentClips = [...accepted].sort((a, b) => (b.highlight_score || 0) - (a.highlight_score || 0)).slice(0, 6);
  const hasAcceptedClips = accepted.length > 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (project.player_name || "").split(" ")[0] || "Player";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      {/* Pull-to-refresh indicator */}
      <div
        className="pointer-events-none flex items-center justify-center transition-opacity md:hidden"
        style={{ height: pull, opacity: pull / 70 }}
        aria-hidden="true">
        <RefreshCw className={`h-6 w-6 text-primary ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: `rotate(${pull * 3}deg)` }} />
      </div>
      {/* Greeting + quick actions */}
      <div className="animate-slide-up">
        <p className="label-xs text-primary">{greeting},</p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-[0.85] sm:text-7xl">{firstName}.</h1>
        <p className="mt-4 max-w-md text-foreground/65">
          {ready ? "Your portfolio is share-ready. Keep it fresh." : "Upload a game and we'll find your highlights — then build your reel."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <AddGameDialog projectId={project.id} onDone={load}
            trigger={<Button><Upload className="mr-2 h-4 w-4" />Upload game</Button>} />
          <Button onClick={() => recordRef.current?.click()} disabled={recordBusy} variant="outline">
            {recordBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {recordBusy ? "Recording…" : "Record game"}
          </Button>
          <input ref={recordRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onRecord} />
          <CreateReelDialog project={project} games={games} clips={clips} reload={load}
            trigger={<Button disabled={!hasAcceptedClips} variant="outline"><Sparkles className="mr-2 h-4 w-4" />Create reel</Button>} />
          <SharePortfolioButton project={project} label="Share" tone="light" />
        </div>
      </div>

      {/* Portfolio status */}
      <GlassCard className="mt-10 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          {ready ? (
            <GlassBadge tone="success"><CheckCircle2 className="h-4 w-4" /> Ready to share</GlassBadge>
          ) : (
            <GlassBadge tone="danger"><AlertCircle className="h-4 w-4" /> Complete profile</GlassBadge>
          )}
          <span className="text-sm text-foreground/55">{completion}% complete · {missing.length} field(s) missing</span>
        </div>
        <Link to={`/project/${project.id}`} className="label-sm inline-flex items-center gap-2 text-primary hover:text-foreground">
          Edit profile <ArrowRight className="h-4 w-4" />
        </Link>
      </GlassCard>

      {/* Stats strip */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Games", value: games.length, icon: Film, to: `/project/${project.id}?tab=games` },
          { label: "Clips", value: clips.length, icon: Scissors, to: `/project/${project.id}?tab=clips`, accent: true },
          { label: "Reels", value: reels.length, icon: Film, to: `/project/${project.id}?tab=exports` },
          { label: "Views", value: views, icon: Eye, to: `/project/${project.id}?tab=analytics` },
        ].map((s) => (
          <Link key={s.label} to={s.to}>
            <GlassStatCard icon={s.icon} value={s.value} label={s.label} accent={s.accent} className="h-full glass-press hover:shadow-glass-lg" />
          </Link>
        ))}
      </div>

      {newInquiries > 0 && (
        <Link to={`/project/${project.id}?tab=inquiries`} className="mt-4 block">
          <GlassCard variant="tint" hover className="flex items-center gap-2 px-4 py-3 text-sm text-primary">
            <Mail className="h-4 w-4" /> You have {newInquiries} new coach inquiry{newInquiries > 1 ? "s" : ""}. <ArrowRight className="ml-auto h-4 w-4" />
          </GlassCard>
        </Link>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Recent games */}
        <div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <h2 className="font-display text-2xl uppercase tracking-tight">Recent games</h2>
            <Link to={`/project/${project.id}?tab=games`} className="label-xs text-primary hover:text-foreground">All</Link>
          </div>
          {recentGames.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-foreground/40">
              No games yet. <AddGameDialog projectId={project.id} onDone={load} trigger={<span className="text-primary underline">Upload your first game</span>} />.
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {recentGames.map((g) => {
                const gc = clips.filter((c) => c.game_id === g.id).length;
                return (
                  <button key={g.id} onClick={() => navigate(`/project/${project.id}/game/${g.id}`)}
                    className="group flex w-full items-center justify-between gap-3 glass squircle px-4 py-3.5 text-left transition hover:bg-white/10">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{g.name}</p>
                      <p className="text-xs text-foreground/45">{[g.opponent && `vs ${g.opponent}`, g.game_date].filter(Boolean).join(" · ") || "No details"} · {gc} clips</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground/20 group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI processing */}
        <div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <h2 className="font-display text-2xl uppercase tracking-tight">Processing</h2>
            <span className="label-xs text-foreground/40">{processing.length} active</span>
          </div>
          {processing.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-foreground/40">
              Nothing processing. All up to date.
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {processing.map((s) => (
                <GlassAIPanel key={s.id} icon={Sparkles}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{s.title || s.url}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <Progress value={s.progress || 5} className="mt-3 h-1.5" />
                </GlassAIPanel>
              ))}
            </div>
          )}
        </div>

        {/* Recent clips */}
        <div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <h2 className="font-display text-2xl uppercase tracking-tight">Top clips</h2>
            <Link to={`/project/${project.id}?tab=clips`} className="label-xs text-primary hover:text-foreground">All</Link>
          </div>
          {recentClips.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-foreground/40">
              No accepted clips yet. Upload a game to get started.
            </GlassCard>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recentClips.map((c) => {
                const meta = catMeta(c.category);
                return (
                  <Link key={c.id} to={`/project/${project.id}/game/${c.game_id}`}>
                    <GlassCard hover className="p-3.5 h-full">
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="text-[10px] font-semibold text-primary">★ {c.highlight_score || 0}</span>
                      </div>
                      <p className="mt-2 truncate text-xs font-medium">{c.play_type || c.description || meta.label}</p>
                      <p className="text-[10px] text-foreground/40">{fmtTime(c.start_seconds)}–{fmtTime(c.end_seconds)}</p>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Highlight reels */}
        <div>
          <div className="flex items-end justify-between gap-4 pb-3">
            <h2 className="font-display text-2xl uppercase tracking-tight">Highlight reels</h2>
            <Link to={`/project/${project.id}?tab=exports`} className="label-xs text-primary hover:text-foreground">All</Link>
          </div>
          {reels.length === 0 ? (
            <GlassCard className="p-8 text-center text-sm text-foreground/40">
              No reels yet. {hasAcceptedClips
                ? <CreateReelDialog project={project} games={games} clips={clips} reload={load} trigger={<span className="text-primary underline">Create one</span>} />
                : "Accept some clips first."}
            </GlassCard>
          ) : (
            <div className="space-y-2.5">
              {reels.slice(0, 3).map((t) => (
                <Link key={t.id} to={`/project/${project.id}?tab=exports`}>
                  <GlassCard hover className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.version_label || t.title || "Highlight reel"} {t.is_featured && <Star className="ml-1 inline h-3.5 w-3.5 fill-primary text-primary" />}</p>
                      <p className="text-xs text-foreground/45">{t.clip_count} clips · {fmtTime(t.duration_seconds)} · {t.reel_length || "—"}</p>
                    </div>
                    <Play className="h-4 w-4 shrink-0 text-foreground/20" />
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}