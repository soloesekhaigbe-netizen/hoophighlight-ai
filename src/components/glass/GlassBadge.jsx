import { cn } from "@/lib/utils";

// Translucent glass pill. tone: default | accent | success | danger.
export default function GlassBadge({ children, tone = "default", className }) {
  const tones = {
    default: "text-foreground/70",
    accent: "text-primary",
    success: "text-emerald-300",
    danger: "text-rose-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-[11px] font-semibold tracking-[0.14em]", tones[tone], className)}>
      {children}
    </span>
  );
}