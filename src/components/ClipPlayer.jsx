import { ExternalLink } from "lucide-react";

export default function ClipPlayer({ source, start = 0, end = 0, autoplay = false }) {
  if (!source) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-900 text-sm text-slate-500">No video source</div>;
  }

  if (source.source_type === "youtube") {
    const params = new URLSearchParams({
      start: String(Math.max(0, Math.floor(start))),
      end: String(Math.max(1, Math.ceil(end))),
      autoplay: autoplay ? "1" : "0",
      rel: "0",
      modestbranding: "1",
    });
    return (
      <iframe
        title="clip"
        className="aspect-video w-full rounded-xl bg-black"
        src={`https://www.youtube-nocookie.com/embed/${source.external_id}?${params.toString()}`}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 text-center">
      <p className="text-sm text-slate-400">
        Veo recordings can't be embedded here. Open the match and jump to the timestamp.
      </p>
      <a
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950"
      >
        Open in Veo <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}