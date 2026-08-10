import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-xl font-semibold text-slate-800">Portfolio not available</p>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-xs text-slate-400">This portfolio may be private or the link is incorrect.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PortfolioHeader project={data.project} />
      <main className="mx-auto max-w-5xl space-y-14 px-5 py-12">
        <HighlightsGrid clips={data.clips} tapes={data.tapes} projectId={data.project.id} />
        <PortfolioGameList games={data.games} />
        <ContactForm projectId={data.project.id} />
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        Recruiting portfolio · {data.project.player_name}
      </footer>
    </div>
  );
}