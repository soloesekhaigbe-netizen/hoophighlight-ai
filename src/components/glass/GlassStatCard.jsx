import { cn } from "@/lib/utils";

// Glass stat tile: icon, large value, small label. accent tints the value orange.
export default function GlassStatCard({ icon: Icon, value, label, accent = false, className }) {
  return (
    <div className={cn("glass squircle p-5 transition-colors", className)}>
      {Icon ? <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-foreground/40")} /> : null}
      <p className={cn("mt-3 font-display text-4xl leading-none", accent && "text-primary")}>{value}</p>
      <p className="label-xs mt-2 text-foreground/45">{label}</p>
    </div>
  );
}