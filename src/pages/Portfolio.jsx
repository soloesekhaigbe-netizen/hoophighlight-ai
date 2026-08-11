import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageShell from "@/components/nav/PageShell";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import HighlightsGrid from "@/components/portfolio/HighlightsGrid";
import PortfolioGameList from "@/components/portfolio/PortfolioGameList";
import ContactForm from "@/components/portfolio/ContactForm";
import ReelPlayer from "@/components/project/ReelPlayer";
import SharePortfolioButton from "@/components/SharePortfolioButton";
import GlassCard from "@/components/glass/GlassCard";
import { CATEGORIES } from "@/lib/categories";
import { Film, CalendarDays, Mail, User, Loader2, Play, BarChart3 } from "lucide-react";

export default function Portfolio() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reel, setReel] = useState(null);

  useEffect(() => {
    base44.functions.invoke("getPublicPortfolio", { project_id: id })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message || "Not available"));
  }, [id]);

  if (error) {
    return (
      <PageShell items={[]} brandTo="/" footer="Be the next player.">
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center text-foreground">
          <p className="font-display text-4xl uppercase">Not available</p>
          <p className="text-sm text-foreground/60">{error}</p>
          <p className="text-xs text-foreground/40">This portfolio may be private or the link is incorrect.</p>
        </div>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell items={[]} brandTo="/" footer="Be the next player.">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  const featured = data.tapes.find((t) => t.is_featured && t.category === "mix") || data.tapes.find((t) => t.category === "mix");
  const catCounts = CATEGORIES.map((c) => ({ ...c, count: data.clips.filter((x) => x.category === c.key).length }));

  const items = [
    { to: "#overview", label: "Overview", icon: User },
    ...(featured ? [{ to: "#reel", label: "Reel", icon: Film }] : []),
    { to: "#highlights", label: "Highlights", icon: Film },
    { to: "#stats", label: "Statistics", icon: BarChart3 },
    { to: "#games", label: "Games", icon: CalendarDays },
    { to: "#contact", label: "Contact", icon: Mail },
  ];

  const reelSources = data.clips.map((c) => ({
    id: c.video_source_id || c.id,
    source_type: c.source_type,
    external_id: c.external_id,
    file_url: c.clip_url,
  }));

  return (
    <PageShell items={items} brandTo="/" footer="Be the next player.">
      {/* Hero */}
      <section id="overview" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <PortfolioHeader project={data.project} />
          <div className="mt-8 flex flex-wrap gap-3">
            <SharePortfolioButton project={data.project} label="Share portfolio" tone="light" />
            {featured && (
              <a href="#reel" className="inline-flex items-center gap-2 glass squircle-sm px-5 py-2.5 font-heading text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:bg-white/10"
                onClick={() => base44.functions.invoke("trackPortfolioEvent", { project_id: data.project.id, event_type: "link_click" }).catch(() => {})}>
                <Play className="h-4 w-4 text-primary" /> Watch highlight reel
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Featured highlight reel */}
      {featured && (
        <section id="reel" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
              <h2 className="display-xl text-5xl sm:text-7xl">Highlight<br />reel.</h2>
              <span className="label-xs text-foreground/50">{featured.clip_count} clips</span>
            </div>
            <button onClick={() => setReel(featured)}
              className="group mt-8 flex w-full flex-col items-center justify-center gap-4 glass-strong squircle-xl py-16 text-foreground transition hover:bg-white/10 sm:py-24">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] text-primary-foreground shadow-glow transition group-hover:scale-110">
                <Play className="ml-1 h-7 w-7" />
              </span>
              <span className="font-display text-3xl uppercase sm:text-4xl">{featured.version_label || featured.title || "Highlight Reel"}</span>
              <span className="label-xs text-foreground/60">Tap to play · {featured.clip_count} clips</span>
            </button>
          </div>
        </section>
      )}

      {/* Highlights */}
      <section id="highlights" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <HighlightsGrid clips={data.clips} tapes={data.tapes} projectId={data.project.id} />
        </div>
      </section>

      {/* Statistics */}
      <section id="stats" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
            <h2 className="display-xl text-5xl sm:text-7xl">By the<br />numbers.</h2>
            <span className="label-xs text-foreground/60">Season totals</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catCounts.map((c) => (
              <GlassCard key={c.key} className="p-7">
                <span className="text-2xl">{c.emoji}</span>
                <p className="mt-4 font-display text-6xl leading-none sm:text-7xl">{c.count}</p>
                <p className="label-xs mt-2 text-foreground/55">{c.label}</p>
              </GlassCard>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <GlassCard className="p-7">
              <p className="label-xs text-foreground/55">Games</p>
              <p className="mt-2 font-display text-6xl leading-none sm:text-7xl">{data.games.length}</p>
            </GlassCard>
            <GlassCard className="p-7">
              <p className="label-xs text-foreground/55">Total highlights</p>
              <p className="mt-2 font-display text-6xl leading-none sm:text-7xl">{data.clips.length}</p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <PortfolioGameList games={data.games} />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <ContactForm projectId={data.project.id} player={data.project} />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-[20vw] leading-[0.8] sm:text-[11rem] text-foreground/90">Prospect</p>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-xs text-foreground/60">Recruiting portfolio · {data.project.player_name}</p>
            <p className="label-xs text-foreground/60">Build. Play. Get discovered.</p>
          </div>
        </div>
      </footer>

      {reel && (
        <ReelPlayer open={!!reel} onOpenChange={() => setReel(null)} tape={reel}
          clips={data.clips} sources={reelSources} games={data.games} project={data.project} />
      )}
    </PageShell>
  );
}