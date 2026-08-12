import { Image } from "@/components/ui/image";
import Logo from "@/components/Logo";
import SharePortfolioButton from "@/components/SharePortfolioButton";
import { Mail } from "lucide-react";

// Sticky left rail: brand, portrait with jersey watermark, identity,
// academics and a contact CTA. Data only — no fetch logic here.
export default function PortfolioSidebar({ project }) {
  const meta = [
    [project.position, project.team_name].filter(Boolean).join(" · "),
    [project.height, project.weight].filter(Boolean).join(" · "),
    [project.school, project.graduation_year].filter(Boolean).join(" · "),
    [project.city, project.country].filter(Boolean).join(", "),
  ].filter(Boolean);

  const academics = [
    project.academic_gpa && { label: "GPA", value: project.academic_gpa },
    project.academic_sat && { label: "SAT", value: project.academic_sat },
    project.academic_notes && { label: "Honours", value: project.academic_notes },
  ].filter(Boolean);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <Logo tone="sun" color="text-foreground" />
        <SharePortfolioButton project={project} tone="light" label="Share" />
      </div>

      {/* Portrait + jersey watermark */}
      <div className="relative mt-6 overflow-hidden glass squircle-lg">
        {project.jersey_number && (
          <span className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 select-none font-display text-[10rem] leading-[0.8] text-white/[0.05] sm:text-[13rem]">
            {project.jersey_number}
          </span>
        )}
        <div className="aspect-[3/4] w-full">
          {project.profile_photo ? (
            <Image src={project.profile_photo} alt={project.player_name} fittingType="fill" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground/20">
              <span className="font-display text-7xl">{project.jersey_number ? `#${project.jersey_number}` : "P"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="mt-6">
        <p className="label-xs text-primary">Player portfolio</p>
        <div className="mt-2 flex items-baseline gap-3">
          {project.jersey_number && <span className="font-display text-5xl leading-none text-primary">#{project.jersey_number}</span>}
          <h1 className="font-display text-3xl uppercase leading-none sm:text-4xl">{project.player_name}</h1>
        </div>
        {meta.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-foreground/65">
            {meta.map((m, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Academics */}
      {academics.length > 0 && (
        <div className="mt-6 flex gap-2">
          {academics.map((a) => (
            <div key={a.label} className="flex-1 glass squircle-sm p-3 text-center">
              <p className="label-xs text-foreground/45">{a.label}</p>
              <p className="mt-1 font-display text-lg leading-none">{a.value}</p>
            </div>
          ))}
        </div>
      )}

      {project.bio && <p className="mt-6 text-sm leading-relaxed text-foreground/60">{project.bio}</p>}

      {/* Contact CTA */}
      <a
        href="#contact"
        className="mt-7 inline-flex items-center justify-center gap-2 squircle bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] px-5 py-3 font-heading text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-glow transition hover:brightness-105"
      >
        <Mail className="h-4 w-4" /> Contact {project.player_name}
      </a>

      {project.email && project.show_email && (
        <a
          href={`mailto:${project.email}`}
          className="mt-3 inline-flex items-center justify-center gap-2 squircle-sm border border-white/10 px-5 py-2.5 text-xs text-foreground/70 transition hover:bg-white/10"
        >
          <Mail className="h-3.5 w-3.5" /> {project.email}
        </a>
      )}
    </div>
  );
}