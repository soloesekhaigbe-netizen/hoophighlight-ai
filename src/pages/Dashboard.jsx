import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { slugify, publicPortfolioUrl } from "@/lib/slugify";
import { ACTIVE_STATUSES } from "@/lib/categories";
import NewProjectDialog from "@/components/projects/NewProjectDialog";
import { Plus, ExternalLink, CheckCircle2, Circle, Film, Scissors, Mail, Eye, Loader2 } from "lucide-react";

const PROFILE_FIELDS = [
  "player_name", "jersey_number", "team_name", "position", "height", "weight",
  "city", "country", "school", "graduation_year", "bio", "profile_photo", "email", "academic_gpa",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [clips, setClips] = useState([]);
  const [tapes, setTapes] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (u) => {
    const me = u || await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    let projects = await base44.entities.Project.filter({ owner_user_id: me.id });

    // Auto-create a starter portfolio on first visit so the player has one.
    if (!projects || projects.length === 0) {
      const starter = await base44.entities.Project.create({
        player_name: me.full_name || "New Player",
        jersey_number: "0", team_name: "Unassigned", position: "Unassigned",
        email: me.email || "", owner_user_id: me.id,
        slug: slugify(me.full_name || "new-player"),
        is_public: true, show_email: false, intro_enabled: true, outro_enabled: true,
        identity_threshold: 90, calibrated: false,
      });
      projects = [starter];
    }
    const p = projects[0];
    setProject(p);
    const [c, t, q, s] = await Promise.all([
      base44.entities.Clip.filter({ project_id: p.id }),
      base44.entities.HighlightTape.filter({ project_id: p.id }),
      base44.entities.CoachInquiry.filter({ project_id: p.id }),
      base44.entities.VideoSource.filter({ project_id: p.id }),
    ]);
    setClips(c); setTapes(t); setInquiries(q); setSources(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }
  if (!project) return <p className="text-sm text-slate-400">Sign in to view your dashboard.</p>;

  // Profile completion
  const filled = PROFILE_FIELDS.filter((f) => {
    const v = project[f];
    if (f === "academic_gpa") return Boolean(v);
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v) && v !== "0" && v !== "Unassigned";
  }).length;
  const completion = Math.round((filled / PROFILE_FIELDS.length) * 100);

  // Quality check
  const checks = [
    { ok: (project.reference_photos || []).length > 0, label: "At least one reference photo" },
    { ok: project.calibrated !== false && Boolean(project.calibration_source_id), label: "Player calibrated" },
    { ok: clips.some((c) => c.status === "accepted" && c.processing_status === "ready"), label: "At least one accepted clip" },
    { ok: tapes.some((t) => t.status === "ready"), label: "At least one highlight tape" },
    { ok: project.is_public !== false, label: "Portfolio is public" },
  ];
  const passed = checks.filter((c) => c.ok).length;

  const slug = project.slug || slugify(project.player_name);
  const portfolioUrl = publicPortfolioUrl(slug);
  const processing = sources.filter((s) => ACTIVE_STATUSES.includes(s.status));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.34em] text-orange-400">MY PORTFOLIO</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">
            {project.player_name}{project.jersey_number && project.jersey_number !== "0" ? <span className="text-slate-600"> #{project.jersey_number}</span> : null}
          </h1>
          <p className="mt-2 text-sm text-slate-400">{project.team_name || "Set your team"}{project.position && project.position !== "Unassigned" ? ` · ${project.position}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={portfolioUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" className="border-white/10 bg-transparent text-slate-200 hover:bg-white/5">
              <ExternalLink className="mr-2 h-4 w-4" /> View public page
            </Button>
          </a>
          <Link to={`/project/${project.id}`}>
            <Button className="bg-orange-500 text-slate-950 hover:bg-orange-400">Manage project</Button>
          </Link>
        </div>
      </div>

      {completion < 100 && (
        <div className="rounded-3xl border border-orange-500/30 bg-orange-500/[0.06] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-orange-200">Complete your profile</p>
              <p className="mt-1 text-xs text-slate-400">Coaches can't find you until your profile is complete. Fill in your details, add reference photos, and calibrate player identification.</p>
            </div>
            <Link to={`/project/${project.id}`}>
              <Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Complete profile →</Button>
            </Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-2 text-right text-[11px] text-slate-500">{completion}% complete</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Eye, "PORTFOLIO VIEWS", 0],
          [Film, "HIGHLIGHT TAPES", tapes.filter((t) => t.status === "ready").length],
          [Scissors, "ACCEPTED CLIPS", clips.filter((c) => c.status === "accepted").length],
          [Mail, "COACH ENQUIRIES", inquiries.length],
        ].map(([Icon, label, value]) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <Icon className="h-5 w-5 text-orange-400" />
            <p className="mt-4 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">RECRUITING QUALITY CHECK</p>
          <p className="mt-1 text-xs text-slate-400">{passed}/{checks.length} ready for coaches.</p>
          <ul className="mt-4 space-y-3">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 text-sm">
                {c.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-slate-600" />}
                <span className={c.ok ? "text-slate-200" : "text-slate-500"}>{c.label}</span>
              </li>
            ))}
          </ul>
          {passed < checks.length && (
            <Link to={`/project/${project.id}`} className="mt-5 inline-block text-sm text-orange-400 hover:text-orange-300">
              Fix remaining items →
            </Link>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">QUICK LINKS</p>
          <div className="mt-4 space-y-2">
            <Link to={`/project/${project.id}`} className="block rounded-xl border border-white/5 px-4 py-3 text-sm hover:border-orange-500/40 hover:bg-white/5">
              📹 Add game footage
            </Link>
            <Link to={`/project/${project.id}`} className="block rounded-xl border border-white/5 px-4 py-3 text-sm hover:border-orange-500/40 hover:bg-white/5">
              🎬 Build highlight tapes
            </Link>
            <Link to={`/project/${project.id}`} className="block rounded-xl border border-white/5 px-4 py-3 text-sm hover:border-orange-500/40 hover:bg-white/5">
              ✉️ Reach out to coaches
            </Link>
            <a href={portfolioUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/5 px-4 py-3 text-sm hover:border-orange-500/40 hover:bg-white/5">
              🔗 Share your portfolio
            </a>
          </div>
          {processing.length > 0 && (
            <p className="mt-4 text-xs text-orange-300">{processing.length} video(s) still processing…</p>
          )}
        </div>
      </div>

      {user && (user.role === "admin") && (
        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">ADMIN</p>
          <p className="mt-2 text-xs text-slate-400">Add another player project (admin only).</p>
          <div className="mt-4">
            <NewProjectDialog onCreated={(p) => navigate(`/project/${p.id}`)}
              trigger={<Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400"><Plus className="mr-2 h-4 w-4" /> Add player project</Button>} />
          </div>
        </div>
      )}
    </div>
  );
}