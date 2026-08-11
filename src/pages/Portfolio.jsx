import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PublicHeader from "@/components/portfolio/PublicHeader";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import HighlightsGrid from "@/components/portfolio/HighlightsGrid";
import PortfolioGameList from "@/components/portfolio/PortfolioGameList";
import ContactForm from "@/components/portfolio/ContactForm";
import { Loader2 } from "lucide-react";

// Public recruiting portfolio. Anyone can view (no account). Data is served by the
// getPublicPortfolio backend function, which only returns public projects.
export default function Portfolio() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getPublicPortfolio", { project_id: id })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message || "Not available"));
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center text-slate-100">
        <p className="font-heading text-xl font-semibold text-orange-400">Portfolio not available</p>
        <p className="text-sm text-slate-400">{error}</p>
        <p className="text-xs text-slate-500">This portfolio may be private or the link is incorrect.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-body text-slate-100">
      <PublicHeader />
      <main className="mx-auto max-w-5xl space-y-16 px-5 py-12 sm:px-6">
        <section id="overview" className="scroll-mt-20">
          <PortfolioHeader project={data.project} />
        </section>
        <section id="highlights" className="scroll-mt-20">
          <HighlightsGrid clips={data.clips} tapes={data.tapes} projectId={data.project.id} />
        </section>
        <section id="games" className="scroll-mt-20">
          <PortfolioGameList games={data.games} />
        </section>
        <section id="contact" className="scroll-mt-20">
          <ContactForm projectId={data.project.id} player={data.project} />
        </section>
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <span className="tracking-[0.18em]">RECRUITING PORTFOLIO</span> · {data.project.player_name}
      </footer>
    </div>
  );
}