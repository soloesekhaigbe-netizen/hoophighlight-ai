import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import PageShell from "@/components/nav/PageShell";
import { ArrowRight, Sparkles, Map, LogIn, Scissors, BarChart3, Film, Share2, Mail } from "lucide-react";

const FEATURES = [
  { n: "01", icon: Scissors, title: "AI highlight detection", body: "Drop game footage. The vision engine finds your buckets, rebounds, blocks and shots — automatically." },
  { n: "02", icon: Film, title: "Game history", body: "Every fixture logged with opponents and dates. Your season, archived like a magazine spread." },
  { n: "03", icon: BarChart3, title: "Statistics", body: "Category breakdowns and clip counts rendered as oversized editorial typography, not tiny cards." },
  { n: "04", icon: Share2, title: "Shareable portfolio", body: "One link. Mobile-first, fast, built to send to any coach, scout, academy or programme." },
  { n: "05", icon: Mail, title: "Coach contact", body: "Recruiters reach you straight through your portfolio. Inquiries land in your dashboard." },
];

const STEPS = [
  { n: "01", title: "Build your profile", body: "Identity, measurements, academics and a photo. We track what's missing." },
  { n: "02", title: "Drop your footage", body: "Upload a game file or paste a link. The AI detects your plays." },
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
      {/* Hero — ink black */}
      <section className="relative bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label-xs text-sun">The basketball player platform</p>
            <h1 className="mt-5 display-xl text-[18vw] leading-[0.82] sm:text-[12vw] lg:text-[8.5rem]">
              Be the<br />next<br />player.
            </h1>
            <p className="mt-7 max-w-md text-base text-paper/70 sm:text-lg">
              PROSPECT turns your game footage into a professional, shareable portfolio — AI-detected highlights, stats and game history, built for coaches and scouts.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {authed ? (
                <Link to="/dashboard"><Button size="lg" className="rounded-none bg-sun text-ink hover:bg-sun-deep">Go to dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              ) : (
                <Link to="/register"><Button size="lg" className="rounded-none bg-sun text-ink hover:bg-sun-deep">Start free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              )}
              {!authed && <Link to="/login"><Button size="lg" variant="outline" className="rounded-none border-paper/30 bg-transparent text-paper hover:bg-white/10">Log in</Button></Link>}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] w-full overflow-hidden border border-paper/15 bg-paper">
              <Image src="https://media.base44.com/images/public/6a7a0f20d7d4a7173f11b298/1f2620751_generated_image.png" fittingType="fill" className="h-full w-full" />
              <div className="absolute bottom-3 left-3 label-xs bg-ink/80 px-2 py-1 text-sun">No. 23 / Editorial</div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip — sun */}
      <section className="bg-sun text-ink">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="font-display text-2xl uppercase tracking-tight sm:text-4xl">
            Build. Play. Get discovered.
          </p>
        </div>
      </section>

      {/* Features — paper, editorial index */}
      <section id="features" className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-6">
            <h2 className="display-xl text-5xl sm:text-7xl">Everything<br />you need.</h2>
            <span className="label-xs hidden text-ink/50 sm:block">Index 01—05</span>
          </div>
          <ul className="mt-2 divide-y divide-ink/10">
            {FEATURES.map((f) => (
              <li key={f.n} className="group grid gap-4 py-7 sm:grid-cols-12 sm:items-baseline">
                <span className="font-display text-3xl text-flame sm:col-span-2">{f.n}</span>
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-3">
                    <f.icon className="h-5 w-5 text-ink/60" />
                    <h3 className="font-display text-2xl uppercase sm:text-3xl">{f.title}</h3>
                  </div>
                </div>
                <p className="text-ink/70 sm:col-span-6">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works — rose */}
      <section id="how" className="bg-rose text-ink">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className="label-xs">How it works</p>
          <h2 className="mt-3 display-xl text-5xl sm:text-7xl">Three steps<br />to seen.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-ink pt-5">
                <p className="font-display text-6xl leading-none">{s.n}</p>
                <h3 className="mt-5 font-display text-2xl uppercase">{s.title}</h3>
                <p className="mt-2 text-ink/80">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement — ink */}
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
          <p className="display-xl text-4xl leading-[0.9] sm:text-7xl">
            Your game.<br />Your story.<br /><span className="text-sun">Your move.</span>
          </p>
          <div className="mt-10">
            {authed ? (
              <Link to="/dashboard"><Button size="lg" className="rounded-none bg-sun text-ink hover:bg-sun-deep">Open your dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            ) : (
              <Link to="/register"><Button size="lg" className="rounded-none bg-sun text-ink hover:bg-sun-deep">Create your portfolio <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer — ink */}
      <footer className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="font-display text-[22vw] leading-[0.8] sm:text-[12rem]">Prospect</p>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-xs text-paper/60">Build. Play. Get discovered.</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 label-xs text-paper/70">
              <Link to="/login" className="hover:text-sun">Log in</Link>
              <Link to="/register" className="hover:text-sun">Get started</Link>
              <a href="#features" className="hover:text-sun">Features</a>
            </nav>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}