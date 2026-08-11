import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import PageShell from "@/components/nav/PageShell";
import GlassCard from "@/components/glass/GlassCard";
import GlassBadge from "@/components/glass/GlassBadge";
import { ArrowRight, Sparkles, Map, LogIn, Scissors, BarChart3, Film, Share2, Mail } from "lucide-react";

const FEATURES = [
  { n: "01", icon: Scissors, title: "Highlight detection", body: "Drop game footage. The vision engine finds your buckets, rebounds, blocks and shots — automatically." },
  { n: "02", icon: Film, title: "Game history", body: "Every fixture logged with opponents and dates. Your season, archived like a magazine spread." },
  { n: "03", icon: BarChart3, title: "Statistics", body: "Category breakdowns and clip counts rendered as oversized editorial typography, not tiny cards." },
  { n: "04", icon: Share2, title: "Shareable portfolio", body: "One link. Mobile-first, fast, built to send to any coach, scout, academy or programme." },
  { n: "05", icon: Mail, title: "Coach contact", body: "Recruiters reach you straight through your portfolio. Inquiries land in your dashboard." },
];

const STEPS = [
  { n: "01", title: "Build your profile", body: "Identity, measurements, academics and a photo. We track what's missing." },
  { n: "02", title: "Drop your footage", body: "Upload a game file or paste a link. Your plays are detected automatically." },
  { n: "03", title: "Share your link", body: "Send it to coaches. They watch your highlights and contact you in one tap." },
];

export default function Landing() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false)); }, []);

  const items = [
    { to: "#features", label: "Features", icon: Sparkles },
    { to: "#how", label: "How it works", icon: Map },
    { to: "/login", label: "Log in", icon: LogIn },
    { to: "/register", label: "Get started", icon: ArrowRight },
  ];

  return (
    <PageShell items={items} brandTo="/" footer="Be the next player.">
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7 animate-slide-up">
            <GlassBadge tone="accent" className="mb-6">
              <Sparkles className="h-3.5 w-3.5" /> The basketball player platform
            </GlassBadge>
            <h1 className="display-xl text-[18vw] leading-[0.85] sm:text-[12vw] lg:text-[8.5rem]">
              Be the<br />next<br />player.
            </h1>
            <p className="mt-7 max-w-md text-base text-foreground/70 sm:text-lg">
              PROSPECT turns your game footage into a professional, shareable portfolio — auto-detected highlights, stats and game history, built for coaches and scouts.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {authed ? (
                <Link to="/dashboard"><Button size="lg">Go to dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              ) : (
                <Link to="/register"><Button size="lg">Start free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              )}
              {!authed && <Link to="/login"><Button size="lg" variant="outline">Log in</Button></Link>}
            </div>
          </div>
          <div className="lg:col-span-5 animate-scale-in">
            <GlassCard hover className="relative aspect-[3/4] w-full overflow-hidden !p-0">
              <Image src="https://media.base44.com/images/public/6a7a0f20d7d4a7173f11b298/1f2620751_generated_image.png" fittingType="fill" className="h-full w-full" />
              <div className="absolute bottom-4 left-4">
                <GlassBadge tone="accent" className="bg-background/60">No. 23 / Editorial</GlassBadge>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <section className="px-6">
        <div className="mx-auto max-w-6xl">
          <GlassCard variant="strong" className="flex items-center justify-center py-6">
            <p className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-4xl">
              Build. Play. Get discovered.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6 pb-6">
            <h2 className="display-xl text-5xl sm:text-7xl">Everything<br />you need.</h2>
            <span className="label-xs hidden text-foreground/40 sm:block">Index 01—05</span>
          </div>
          <div className="grid gap-4">
            {FEATURES.map((f) => (
              <GlassCard key={f.n} hover className="grid gap-4 p-6 sm:grid-cols-12 sm:items-center">
                <span className="font-display text-3xl text-primary sm:col-span-2">{f.n}</span>
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] glass text-foreground/70">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-2xl uppercase sm:text-3xl">{f.title}</h3>
                  </div>
                </div>
                <p className="text-foreground/70 sm:col-span-6">{f.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <GlassBadge tone="accent" className="mb-4">How it works</GlassBadge>
          <h2 className="display-xl text-5xl sm:text-7xl">Three steps<br />to seen.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <GlassCard key={s.n} hover className="p-7">
                <p className="font-display text-6xl leading-none text-primary">{s.n}</p>
                <h3 className="mt-5 font-display text-2xl uppercase">{s.title}</h3>
                <p className="mt-2 text-foreground/75">{s.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <GlassCard variant="tint" className="px-8 py-16 sm:py-20">
            <p className="display-xl text-4xl leading-[0.9] sm:text-7xl">
              Your game.<br />Your story.<br /><span className="text-primary">Your move.</span>
            </p>
            <div className="mt-10">
              {authed ? (
                <Link to="/dashboard"><Button size="lg">Open your dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              ) : (
                <Link to="/register"><Button size="lg">Create your portfolio <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              )}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-[22vw] leading-[0.8] sm:text-[12rem] text-foreground/90">Prospect</p>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-xs text-foreground/50">Build. Play. Get discovered.</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 label-xs text-foreground/70">
              <Link to="/login" className="hover:text-primary">Log in</Link>
              <Link to="/register" className="hover:text-primary">Get started</Link>
              <a href="#features" className="hover:text-primary">Features</a>
            </nav>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}