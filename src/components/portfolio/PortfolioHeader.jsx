import { Image } from "@/components/ui/image";
import { Mail, GraduationCap, MapPin, Ruler } from "lucide-react";

export default function PortfolioHeader({ project }) {
  const initials = (project.player_name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <header className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-10 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-500 text-3xl font-bold text-white shadow-sm">
          {project.profile_photo ? (
            <Image src={project.profile_photo} alt={project.player_name} className="h-full w-full object-cover" />
          ) : initials}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
            {project.player_name}
            {project.jersey_number ? <span className="ml-2 text-orange-600">#{project.jersey_number}</span> : null}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {[project.team_name, project.position].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 sm:justify-start">
            {project.height && <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{project.height}{project.weight ? ` · ${project.weight}` : ""}</span>}
            {project.school && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{project.school}{project.graduation_year ? ` · ${project.graduation_year}` : ""}</span>}
            {(project.city || project.country) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[project.city, project.country].filter(Boolean).join(", ")}</span>}
          </div>
          {project.email && (
            <a href={`mailto:${project.email}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              <Mail className="h-4 w-4" /> {project.email}
            </a>
          )}
        </div>
      </div>

      {project.bio && (
        <div className="mx-auto max-w-5xl px-5 pb-8">
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{project.bio}</p>
        </div>
      )}

      {(project.academic_gpa || project.academic_sat || project.academic_notes) && (
        <div className="mx-auto max-w-5xl px-5 pb-10">
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-slate-400">GPA</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{project.academic_gpa || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-slate-400">SAT</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{project.academic_sat || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-slate-400">NOTES</p>
              <p className="mt-1 text-xs text-slate-600">{project.academic_notes || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}