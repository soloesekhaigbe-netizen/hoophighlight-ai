import { Image } from "@/components/ui/image";
import { Mail, GraduationCap, MapPin, Ruler, User } from "lucide-react";

// Premium public hero. Mirrors the dashboard header hierarchy (tracked label,
// bold name, number in orange accent) but framed for a public portfolio.
export default function PortfolioHeader({ project }) {
  const initials = (project.player_name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div>
      <p className="text-[11px] tracking-[0.34em] text-orange-400">PLAYER PORTFOLIO</p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-3xl font-bold text-orange-400 shadow-lg">
          {project.profile_photo ? (
            <Image src={project.profile_photo} alt={project.player_name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex items-center justify-center"><User className="h-10 w-10 text-slate-600" /></span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.player_name}
          </h1>
          {project.jersey_number ? (
            <p className="mt-1 font-heading text-2xl font-semibold text-orange-500 sm:text-3xl">#{project.jersey_number}</p>
          ) : null}
          <p className="mt-2 text-sm font-medium text-slate-300">
            {[project.team_name, project.position].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-slate-400 sm:justify-start">
            {project.height && <span className="inline-flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5 text-orange-400" />{project.height}{project.weight ? ` · ${project.weight}` : ""}</span>}
            {project.school && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-orange-400" />{project.school}{project.graduation_year ? ` · ${project.graduation_year}` : ""}</span>}
            {(project.city || project.country) && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-400" />{[project.city, project.country].filter(Boolean).join(", ")}</span>}
          </div>
          {project.email && (
            <a href={`mailto:${project.email}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400">
              <Mail className="h-4 w-4" /> {project.email}
            </a>
          )}
        </div>
      </div>

      {project.bio && (
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-400">{project.bio}</p>
      )}

      {(project.academic_gpa || project.academic_sat || project.academic_notes) && (
        <div className="mt-6 grid gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">GPA</p>
            <p className="mt-1 text-lg font-semibold">{project.academic_gpa || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">SAT</p>
            <p className="mt-1 text-lg font-semibold">{project.academic_sat || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">NOTES</p>
            <p className="mt-1 text-xs text-slate-400">{project.academic_notes || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
}