import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.85rem] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground shadow-[0_8px_24px_-8px_rgba(255,90,31,0.65)] hover:brightness-105 hover:shadow-[0_12px_32px_-8px_rgba(255,90,31,0.85)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_24px_-8px_rgba(229,57,53,0.5)] hover:brightness-105",
        outline:
          "glass text-foreground hover:bg-white/10",
        secondary:
          "glass-strong text-foreground hover:bg-white/10",
        ghost: "text-foreground/70 hover:bg-white/10 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[0.7rem] px-3 text-xs",
        lg: "h-12 rounded-[1rem] px-8 text-base",
        icon: "h-10 w-10 rounded-[0.85rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }