import { STATUS_LABELS } from "@/lib/categories";

const TONE = {
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  error: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  queued: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
};

export default function StatusBadge({ status }) {
  const tone = TONE[status] || "bg-amber-500/15 text-amber-300 ring-amber-500/30";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em] ring-1 ${tone}`}>
      {!["ready", "error"].includes(status) && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {STATUS_LABELS[status] || status}
    </span>
  );
}