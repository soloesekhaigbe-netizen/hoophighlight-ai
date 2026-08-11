import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import AmbientBackground from "@/components/glass/AmbientBackground";

// Premium glass auth shell over the ambient base.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <AmbientBackground />
      <Link to="/" className="mb-8 inline-flex">
        <Logo markClass="h-10 w-10" />
      </Link>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center squircle glass text-primary">
            {Icon ? <Icon className="h-7 w-7" /> : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="glass-strong squircle-lg p-8">
          {children}
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </div>
  );
}