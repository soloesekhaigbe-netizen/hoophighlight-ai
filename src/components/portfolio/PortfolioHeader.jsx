import { Image } from "@/components/ui/image";
import { Mail, GraduationCap, MapPin, Ruler, User } from "lucide-react";

// Glass athlete hero. The jersey number remains the major graphic element.
export default function PortfolioHeader({ project }) {
  const meta = [
    project.height && { icon: Ruler, text: `${project.height}${project.weight ? `  ·  ${project.weight}` : ""}` },
    project.school && { icon: GraduationCap, text: `${project.school}${project.graduation_year ? `  ·  ${project.graduation_year}` : ""}` },
    (project.city || project.country) && { icon: MapPin, text: [project.city, project.country].filter(Boolean).join(", ") },
  ].filter(Boolean);

  return (
    <div className="animate-slide-up">
      <p className="label-xs text-primary">Player portfolio · {project.team_name || "Unassigned"}</p>

      <div className="mt-6 grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            {project.jersey_number && (
              <span className="font-display text-7xl leading-[0.8] text-primary sm:text-[9rem]">#{project.jersey_number}</span>
            )}
            <h1 className="display-xl text-5xl leading-[0.85] sm:text-7xl">{project.player_name}</h1>
          </div>
          <p className="mt-5 label-sm text-foreground/70">
            {project.position || "—"}{project.team_name ? `  ·  ${project.team_name}` : ""}
          </p>

          {meta.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/60">
              {meta.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-2"><m.icon className="h-4 w-4 text-primary" />{m.text}</span>
              ))}
            </div>
          )}

          {project.bio && <p className="mt-6 max-w-2xl text-foreground/70">{project.bio}</p>}
        </div>

        <div className="lg:col-span-4">
          <div className="aspect-[3/4] w-full overflow-hidden glass squircle-lg">
            {project.profile_photo ? (
              <Image src={project.profile_photo} alt={project.player_name} fittingType="fill" className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-foreground/20">
                <User className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>
      </div>

      {(project.academic_gpa || project.academic_sat || project.academic_notes) && (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="glass squircle p-5"><p className="label-xs text-foreground/50">GPA</p><p className="mt-1 font-display text-3xl">{project.academic_gpa || "—"}</p></div>
          <div className="glass squircle p-5"><p className="label-xs text-foreground/50">SAT</p><p className="mt-1 font-display text-3xl">{project.academic_sat || "—"}</p></div>
          <div className="glass squircle p-5"><p className="label-xs text-foreground/50">Notes</p><p className="mt-1 text-sm text-foreground/70">{project.academic_notes || "—"}</p></div>
        </div>
      )}

      {project.email && (
        <a href={`mailto:${project.email}`}
          className="mt-7 inline-flex items-center gap-2 bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] squircle-sm px-6 py-3 font-heading text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-glow transition hover:brightness-105">
          <Mail className="h-4 w-4" /> {project.email}
        </a>
      )}
    </div>
  );
}