import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Responsive picker: a Vaul bottom-sheet drawer on mobile (<768px) and the
 * standard Radix Select on tablet/desktop. Keeps the same {value,onValueChange}
 * contract so call sites stay simple. Options: [{ value, label }].
 */
export default function MobileSelect({ value, onValueChange, options, placeholder, triggerClassName, title }) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const current = options.find((o) => o.value === value);

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 min-w-[8rem] items-center justify-between gap-2 rounded-[0.9rem] border border-white/10 bg-white/[0.04] px-3.5 text-sm text-foreground backdrop-blur-xl transition-colors hover:bg-white/10",
              triggerClassName
            )}>
            <span className="truncate">{current ? current.label : (placeholder || "Select")}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="glass-strong safe-bottom">
          {title && (
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="max-h-[60vh] overflow-y-auto p-2 pb-6">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={cn(
                  "flex h-12 w-full items-center justify-between rounded-[0.8rem] px-4 text-left text-sm transition-colors",
                  o.value === value ? "bg-primary/15 text-primary" : "text-foreground hover:bg-white/10"
                )}>
                <span>{o.label}</span>
                {o.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}