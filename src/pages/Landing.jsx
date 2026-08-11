import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import Logo, { BallMark } from "@/components/Logo";
import { ArrowRight, Scissors, Film, BarChart3, Share2, Mail, ClipboardList, Menu, X, Play } from "lucide-react";

const FEATURES = [
  { icon: ClipboardList, title: "Player profiles", body: "A premium digital card — name, number, position, measurements, academics and bio, built to travel." },
  { icon: Scissors, title: "AI highlight detection", body: "Upload game footage and HoopScout's vision engine finds your buckets, rebounds, blocks and shooting." },
  { icon: BarChart3, title: "Statistics", body: "Category breakdowns, clip counts and processing status — your season, organised and scannable." },
  { icon: Film, title: "Game history", body: "Every fixture logged with opponents and dates, so coaches see the full picture of your year." },
  { icon: Share2, title: "Shareable portfolio", body: "One link to send to any coach or scout. Mobile-first, fast, and built to make you look professional." },
  { icon: Mail, title: "Coach contact", body: "Recruiters reach you directly through your portfolio — inquiries land straight in your dashboard." },
];

const STEPS = [
  { n: "01", title: "Build your profile", body: "Add your identity, measurements, academics and a photo. HoopScout tracks what's missing." },
  { n: "02", title: "Drop your footage", body: "Upload a game file or paste a link. The AI scans it and detects your plays automatically." },
  { n: "03", title: "Share your link", body: "Send your portfolio to coaches. They watch your highlights and contact you in one tap." },
];

export default function Landing() {
  const [authed, setAuthed] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false)); }, []);
  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menu]);

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-xs font-medium tracking-[0.18em] text-slate-400 transition hover:text-white">FEATURES</a>
            <a href="#how" className="text-xs font-medium tracking-[0.18em] text-slate-400 transition hover:text-white">HOW IT WORKS</a>
            {authed ? (
              <Link to="/dashboard"><Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Go to dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">Log in</Link>
                <Link to="/register"><Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Get started</Button></Link>
              </>
            )}
          </nav>
          <button type="button" aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 md:hidden" onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMenu(false)} />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-xs border-l border-white/10 bg-slate-950 p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200" onClick={() => setMenu(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-8 space-y-1">
              <a href="#features" onClick={() => setMenu(false)} className="block rounded-xl px-3.5 py-3.5 text-sm font-medium text-slate-200 hover:bg-white/5">Features</a>
              <a href="#how" onClick={() => setMenu(false)} className="block rounded-xl px-3.5 py-3.5 text-sm font-medium text-slate-200 hover:bg-white/5">How it works</a>
            </nav>
            <div className="mt-6 space-y-2">
              {authed ? (
                <Link to="/dashboard"><Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400">Go to dashboard</Button></Link>
              ) : (
                <>
                  <Link to="/register"><Button className="w-full bg-orange-500 text-slate-950 hover:bg-orange-400">Get started</Button></Link>
                  <Link to="/login"><Button variant="outline" className="w-full border-white/15 bg-transparent text-slate-200 hover:bg-white/10">Log in</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-orange-300">
              <Play className="h-3.5 w-3.5" /> BASKETBALL PLAYER PLATFORM
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Build your game.<br /><span className="text-gradient-orange">Get discovered.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-slate-400 sm:text-lg">
              HoopScout turns your game footage into a professional, shareable portfolio — AI-detected highlights, stats, game history and a link built for coaches and scouts.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {authed ? (
                <Link to="/dashboard"><Button size="lg" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Go to your dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              ) : (
                <Link to="/register"><Button size="lg" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Start free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              )}
              {!authed && <Link to="/login"><Button size="lg" variant="outline" className="border-white/15 bg-transparent text-slate-100 hover:bg-white/10">Log in</Button></Link>}
            </div>
          </div>

          {/* Visual court card */}
          <div className="mx-auto mt-14 max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
              <div className="relative grid gap-4 sm:grid-cols-3">
                {[["GAMES", "12"], ["CLIPS", "48"], ["VIEWS", "329"]].map(([l, v]) => (
                  <div key={l} className="rounded-2xl border border-white/5 bg-white/[0.04] p-5">
                    <BallMark className="h-7 w-7" />
                    <p className="mt-4 font-heading text-3xl font-bold">{v}</p>
                    <p className="mt-1 text-[10px] tracking-[0.2em] text-slate-500">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <p className="text-[11px] tracking-[0.3em] text-orange-400">EVERYTHING YOU NEED</p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">One portfolio. The full picture.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-surface p-6 transition hover:border-orange-500/30">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/12 text-orange-400">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <p className="text-[11px] tracking-[0.3em] text-orange-400">HOW IT WORKS</p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Three steps to seen.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card-surface p-6">
              <p className="font-heading text-3xl font-bold text-orange-500/80">{s.n}</p>
              <h3 className="mt-3 font-heading text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          {authed ? (
            <Link to="/dashboard"><Button size="lg" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Open your dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          ) : (
            <Link to="/register"><Button size="lg" className="bg-orange-500 text-slate-950 hover:bg-orange-400">Create your portfolio <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          )}
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs tracking-[0.16em] text-slate-500">BUILD YOUR GAME. GET DISCOVERED.</p>
        </div>
      </footer>
    </div>
  );
}