import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CATEGORIES, catMeta } from "@/lib/categories";
import { Loader2 } from "lucide-react";
import PortfolioHeader from "@/components/portfolio/PortfolioHeader";
import HighlightsSection from "@/components/portfolio/HighlightsSection";
import GamesSection from "@/components/portfolio/GamesSection";
import ContactSection from "@/components/portfolio/ContactSection";

export default function Portfolio() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("getPortfolio", { slug });
        if (active) setData(res);
      } catch (e) {
        if (active) setError(e.message || "Not found");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (data?.player?.id) {
      base44.functions.invoke("trackPortfolioEvent", { project_id: data.player.id, event_type: "portfolio_view" }).catch(() => {});
    }
  }, [data?.player?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 px-6 text-center text-slate-300">
        <p className="text-lg font-semibold">Portfolio not found</p>
        <p className="text-sm text-slate-500">This player's portfolio isn't public or doesn't exist.</p>
      </div>
    );
  }

  const { player, clips, tapes, games } = data;
  const clipsByCategory = CATEGORIES.map((c) => ({
    category: c,
    clips: clips.filter((x) => x.category === c.key),
  })).filter((g) => g.clips.length > 0);
  const readyTapes = tapes.filter((t) => t.status === "ready");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PortfolioHeader player={player} tapeCount={readyTapes.length} clipCount={clips.length} />
      <main className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        {player.bio && (
          <section>
            <h2 className="text-[11px] tracking-[0.3em] text-orange-400">ABOUT</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{player.bio}</p>
          </section>
        )}
        <HighlightsSection
          projectId={player.id}
          tapes={readyTapes}
          groups={clipsByCategory}
          gameIdMap={Object.fromEntries(games.map((g) => [g.id, g]))}
        />
        {games.length > 0 && <GamesSection games={games} />}
        <ContactSection player={player} />
      </main>
      <footer className="border-t border-white/5 py-8 text-center text-[11px] tracking-[0.2em] text-slate-600">
        POWERED BY HOOOHIGHLIGHT AI
      </footer>
    </div>
  );
}