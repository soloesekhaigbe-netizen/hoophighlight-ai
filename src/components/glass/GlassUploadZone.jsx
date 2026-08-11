import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Dashed glass drop zone. Put the file input as children.
export default function GlassUploadZone({ loading = false, label = "Upload", className, children, ...props }) {
  return (
    <label
      className={cn(
        "glass-press flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center transition hover:border-primary/40 hover:text-primary",
        className
      )}
      {...props}>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-foreground/50" />}
      <span className="label-xs text-foreground/60">{loading ? "Working…" : label}</span>
      {children}
    </label>
  );
}