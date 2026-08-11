import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageShell from "@/components/nav/PageShell";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import HighlightsGrid from "@/components/portfolio/HighlightsGrid";
import PortfolioGameList from "@/components/portfolio/PortfolioGameList";
import ContactForm from "@/components/portfolio/ContactForm";
import { CATEGORIES } from "@/lib/categories";
import { Film, BarChart3, CalendarDays, Mail, User, Loader2 } from "lucide-react";

// Public recruiting portfolio. Anyone can view (no account). Data is served by
// the getPublicPortfolio backend function, which only returns public projects.
export default function Portfolio() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getPublicPortfolio", { project_id: id })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message || "Not available"));
  }, [id]);

  const items = [
    { to: "#overview", label: "Overview", icon: User },
    { to: "#highlights", label: "Highlights", icon: Film },
    { to: "#stats", label: "Statistics", icon: BarChart3 },
    { to: "#games", label: "Games", icon: CalendarDays },
    { to: "#contact", label: "Contact", icon: Mail },
  ];

  if (error) {
    return (
      <PageShell items={items} brandTo="/" footer="Be the next player.">
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-display text-4xl uppercase">Not available</p>
          <p className="text-sm text-ink/60">{error}</p>
          <p className="text-xs text-ink/40">This portfolio may be private or the link is incorrect.</p>
        </div>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell items={items} brandTo="/" footer="Be the next player.">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-flame" />
        </div>
      </PageShell>
    );
  }

  const catCounts = CATEGORIES.map((c) => ({ ...c, count: data.clips.filter((x) => x.category === c.key).length }));

  return (
    <PageShell items={items} brandTo="/" footer="Be the next player.">
      {/* Hero */}
      <section id="overview" className="scroll-mt-20 bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <PortfolioHeader project={data.project} />
        </div>
      </section>

      {/* Highlights */}
      <section id="highlights" className="scroll-mt-20 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <HighlightsGrid clips={data.clips} tapes={data.tapes} projectId={data.project.id} />
        </div>
      </section>

      {/* Statistics — oversized typography, real counts only */}
      <section id="stats" className="scroll-mt-20 bg-sun text-ink">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex items-end justify-between gap-6 border-b-2 border-ink pb-4">
            <h2 className="display-xl text-5xl sm:text-7xl">By the<br />numbers.</h2>
            <span className="label-xs">Season totals</span>
          </div>
          <div className="mt-6 grid gap-px bg-ink sm:grid-cols-2 lg:grid-cols-4">
            {catCounts.map((c) => (
              <div key={c.key} className="bg-sun p-7">
                <span className="text-2xl">{c.emoji}</span>
                <p className="mt-5 font-display text-7xl leading-none sm:text-8xl">{c.count}</p>
                <p className="label-xs mt-2 text-ink/60">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-px grid gap-px bg-ink sm:grid-cols-2">
            <div className="bg-sun p-7">
              <p className="label-xs text-ink/60">Games</p>
              <p className="mt-2 font-display text-7xl leading-none sm:text-8xl">{data.games.length}</p>
            </div>
            <div className="bg-sun p-7">
              <p className="label-xs text-ink/60">Total highlights</p>
              <p className="mt-2 font-display text-7xl leading-none sm:text-8xl">{data.clips.length}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="scroll-mt-20 bg-rose text-ink">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <PortfolioGameList games={data.games} />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <ContactForm projectId={data.project.id} player={data.project} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="font-display text-[20vw] leading-[0.8] sm:text-[11rem]">Prospect</p>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-xs text-paper/60">Recruiting portfolio · {data.project.player_name}</p>
            <p className="label-xs text-paper/60">Build. Play. Get discovered.</p>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}