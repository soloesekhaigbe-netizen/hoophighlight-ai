// PROSPECT — typographic wordmark + monogram. No generic ball icon.

export function Monogram({ className = "h-9 w-9", tone = "sun" }) {
  const tones = {
    sun: "bg-sun text-ink",
    ink: "bg-ink text-sun",
    paper: "bg-paper text-ink",
    flame: "bg-flame text-paper",
  };
  return (
    <span className={`inline-flex items-center justify-center font-display text-xl leading-none ${tones[tone]} ${className}`}>
      P
    </span>
  );
}

export function Wordmark({ className = "", color = "text-ink" }) {
  return (
    <span className={`font-display uppercase tracking-[0.04em] ${color} ${className}`} style={{ fontSize: "1.15rem" }}>
      Prospect
    </span>
  );
}

export default function Logo({ tone = "sun", showWord = true, color = "text-paper", className = "", markClass = "h-9 w-9" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Monogram tone={tone} className={markClass} />
      {showWord && <Wordmark color={color} />}
    </span>
  );
}