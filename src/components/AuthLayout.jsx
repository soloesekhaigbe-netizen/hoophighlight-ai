import React from "react";
import Logo from "@/components/Logo";

// Premium dark auth shell. The design tokens resolve to the dark navy theme, so
// bg-background / bg-card / border-border all render on-brand automatically.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <Logo markClass="h-10 w-10" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-400">
            {Icon ? <Icon className="h-7 w-7" /> : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}