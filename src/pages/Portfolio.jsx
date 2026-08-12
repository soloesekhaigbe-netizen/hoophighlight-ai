import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AmbientBackground from "@/components/glass/AmbientBackground";
import Logo from "@/components/Logo";
import PortfolioSidebar from "@/components/portfolio/PortfolioSidebar";
import PortfolioReel from "@/components/portfolio/PortfolioReel";
import PortfolioHighlights from "@/components/portfolio/PortfolioHighlights";
import PortfolioNumbers from "@/components/portfolio/PortfolioNumbers";
import ContactForm from "@/components/portfolio/ContactForm";
import ReelPlayer from "@/components/project/ReelPlayer";
import { Loader2 } from "lucide-react";

export default function Portfolio() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reel, setReel] = useState(null);

  useEffect(() => {
    base44.functions
      .invoke("getPublicPortfolio", { project_id: id })
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.error || e?.data?.error || e?.message || "Not available"));
  }, [id]);

  const shell = (children) => (
    <div className="relative min-h-screen font-body text-foreground">
      <AmbientBackground />
      {children}
    </div>
  );

  if (error) {
    return shell(
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Logo tone="sun" color="text-foreground" />
        <p className="mt-6 font-display text-4xl uppercase">Not available</p>
        <p className="text-sm text-foreground/60">{error}</p>
        <p className="text-xs text-foreground/40">This portfolio may be private or the link is incorrect.</p>
      </div>
    );
  }

  if (!data) {
    return shell(
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const featured =
    data.tapes.find((t) => t.is_featured && t.category === "mix") ||
    data.tapes.find((t) => t.category === "mix");

  const reelSources = data.clips.map((c) => ({
    id: c.video_source_id || c.id,
    source_type: c.source_type,
    external_id: c.external_id,
    file_url: c.clip_url,
  }));

  return shell(
    <div className="mx-auto max-w-[1400px] lg:grid lg:grid-cols-[380px_1fr]">
      {/* Sticky identity rail */}
      <aside className="no-scrollbar lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:px-8 lg:py-10 px-6 py-8">
        <PortfolioSidebar project={data.project} />
      </aside>

      {/* Scrolling content rail */}
      <main className="space-y-16 px-6 py-8 pb-20 lg:px-12 lg:py-10">
        {featured && <PortfolioReel featured={featured} clips={data.clips} onPlay={() => setReel(featured)} />}
        <PortfolioHighlights clips={data.clips} tapes={data.tapes} projectId={data.project.id} />
        <PortfolioNumbers clips={data.clips} games={data.games} />
        <ContactForm projectId={data.project.id} player={data.project} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-10 lg:col-span-2">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo tone="sun" color="text-foreground" />
          <p className="label-xs text-foreground/60">Recruiting portfolio · {data.project.player_name}</p>
          <p className="label-xs text-foreground/60">Build. Play. Get discovered.</p>
        </div>
      </footer>

      {reel && (
        <ReelPlayer
          open={!!reel}
          onOpenChange={() => setReel(null)}
          tape={reel}
          clips={data.clips}
          sources={reelSources}
          games={data.games}
          project={data.project}
        />
      )}
    </div>
  );
}