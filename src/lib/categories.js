export const CATEGORIES = [
  { key: "buckets", label: "BUCKETS", emoji: "🏀", accent: "text-orange-400", ring: "ring-orange-500/40", bg: "bg-orange-500/10" },
  { key: "rebounds", label: "REBOUNDS", emoji: "🔄", accent: "text-sky-400", ring: "ring-sky-500/40", bg: "bg-sky-500/10" },
  { key: "blocks", label: "BLOCKS", emoji: "🛡️", accent: "text-emerald-400", ring: "ring-emerald-500/40", bg: "bg-emerald-500/10" },
  { key: "shooting", label: "SHOOTING", emoji: "🎯", accent: "text-fuchsia-400", ring: "ring-fuchsia-500/40", bg: "bg-fuchsia-500/10" },
];

export const catMeta = (key) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];

export const fmtTime = (s = 0) => {
  const t = Math.max(0, Math.round(s));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export const fmtClock = (s = 0) => {
  const t = Math.max(0, Math.floor(s));
  const m = Math.floor(t / 60);
  const sec = t % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export const confidenceLabel = (c = 0) =>
  c >= 85 ? { text: "High", cls: "text-emerald-400" }
  : c >= 65 ? { text: "Medium", cls: "text-amber-400" }
  : { text: "Low", cls: "text-rose-400" };

// Player-identity verdict relative to a project's configurable threshold.
export const identityVerdict = (identityConfidence = 0, threshold = 90) => {
  if (identityConfidence >= threshold) return { text: "AUTO-ACCEPT", cls: "text-emerald-400" };
  if (identityConfidence >= 70) return { text: "REVIEW", cls: "text-amber-400" };
  return { text: "REJECT", cls: "text-rose-400" };
};

export const STATUS_LABELS = {
  queued: "QUEUED",
  downloading: "DOWNLOADING",
  processing: "PROCESSING",
  analysing: "ANALYSING",
  detecting_plays: "DETECTING PLAYS",
  creating_clips: "CREATING CLIPS",
  ready: "READY",
  error: "ERROR",
};

export const ACTIVE_STATUSES = ["queued", "downloading", "processing", "analysing", "detecting_plays", "creating_clips"];