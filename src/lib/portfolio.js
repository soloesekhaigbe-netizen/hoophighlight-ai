export const COMPLETION_FIELDS = [
  "player_name", "jersey_number", "team_name", "position", "height", "weight",
  "school", "graduation_year", "city", "country", "email", "profile_photo",
  "bio", "academic_gpa", "academic_sat", "reference_photos",
];

const filled = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== "");

export function profileCompletion(project) {
  if (!project) return 0;
  const done = COMPLETION_FIELDS.filter((f) => filled(project[f])).length;
  return Math.round((done / COMPLETION_FIELDS.length) * 100);
}

export function completionMissing(project) {
  if (!project) return COMPLETION_FIELDS;
  return COMPLETION_FIELDS.filter((f) => !filled(project[f]));
}

export function portfolioReady(project, acceptedClips = []) {
  return profileCompletion(project) >= 60 && acceptedClips.length >= 1;
}

export function slugify(s = "") {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "player";
}

export function portfolioLink(project) {
  // Use the stable project id so the link resolves regardless of which
  // function version the viewer's client is pinned to (slug lookup requires
  // the latest function, which may not have propagated yet).
  const id = project?.id || project?.slug;
  return `${window.location.origin}/portfolio/${id}`;
}

export function sharePortfolio(project) {
  const url = portfolioLink(project);
  if (navigator.share) return navigator.share({ title: `${project.player_name} — Recruiting Portfolio`, url }).catch(() => {});
  return navigator.clipboard?.writeText(url);
}