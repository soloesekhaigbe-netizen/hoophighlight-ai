import { cn } from "@/lib/utils";

// AI feature panel — orange-tinted glass with an ambient glow.
// Used for auto-detection, reel generation, calibration, etc.
export default function GlassAIPanel({ title, icon: Icon, children, className }) {
  return (
    <div className={cn("glass-tint squircle-lg relative overflow-hidden p-6", className)}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-glow" />
      <div className="relative flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        {title && <p className="label-sm text-primary">{title}</p>}
      </div>
      <div className="relative mt-4">{children}</div>
    </div>
  );
}