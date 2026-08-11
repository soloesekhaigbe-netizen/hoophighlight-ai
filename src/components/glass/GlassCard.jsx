import { cn } from "@/lib/utils";

// Floating glass surface with squircle corners. variant: default | strong | tint.
// hover adds a gentle lift. Rendered as a div by default; pass `as` for other tags.
export default function GlassCard({ as: Comp = "div", variant = "default", hover = false, className, children, ...props }) {
  const surface = variant === "strong" ? "glass-strong" : variant === "tint" ? "glass-tint" : "glass";
  return (
    <Comp
      className={cn(surface, "squircle", hover && "glass-press hover:shadow-[0_20px_70px_-16px_rgba(0,0,0,0.7)]", className)}
      {...props}>
      {children}
    </Comp>
  );
}