// HoopScout brand mark + wordmark. Reusable across the global header, footer,
// auth screens, loading and empty states. Keep the mark inline-SVG so it scales
// crisply and needs no external asset.

export function BallMark({ className = "h-8 w-8" }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-orange-500 ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" className="h-3/5 w-3/5" aria-hidden="true">
        <circle cx="16" cy="16" r="11" stroke="white" strokeWidth="1.6" />
        <path d="M5 16h22 M16 5v22 M8.4 8.4l15.2 15.2 M8.4 23.6l15.2-15.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function Logo({ compact = false, className = "", markClass = "h-8 w-8" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BallMark className={markClass} />
      {!compact && (
        <span className="font-heading text-base font-bold tracking-[0.18em] text-slate-100">
          Hoop<span className="text-orange-500">Scout</span>
        </span>
      )}
    </span>
  );
}