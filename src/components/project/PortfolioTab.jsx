import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "@/components/ui/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ExternalLink, Eye, Loader2, Check, Upload, Trash2, Star, Film } from "lucide-react";
import { portfolioLink } from "@/lib/portfolio";

export default function PortfolioTab({ project, games, clips, tapes, reload }) {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const link = portfolioLink(project);
  const slug = project.slug || project.id;

  const patch = async (data) => { await base44.entities.Project.update(project.id, data); reload(); };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await patch({ profile_photo: file_url });
    } catch (_e) { /* best-effort */ }
    setUploading(false);
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ensureSlug = async () => {
    if (project.slug) return;
    const base = (project.player_name || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    const newSlug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    await base44.entities.Project.update(project.id, { slug: newSlug });
    await reload();
  };

  const reels = tapes.filter((t) => t.category === "mix" && t.status === "ready").sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const featured = reels.find((t) => t.is_featured);

  const setFeatured = async (id) => {
    if (!id) {
      if (featured) await base44.entities.HighlightTape.update(featured.id, { is_featured: false });
      reload(); return;
    }
    if (featured && featured.id === id) return;
    if (featured) await base44.entities.HighlightTape.update(featured.id, { is_featured: false });
    await base44.entities.HighlightTape.update(id, { is_featured: true });
    reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile content editor */}
      <div className="glass squircle-lg p-6">
        <p className="text-[11px] tracking-[0.24em] text-foreground/45">PORTFOLIO CONTENT</p>

        {/* Profile photo */}
        <div className="mt-5 flex items-center gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden squircle border border-white/10 bg-black/30">
            {project.profile_photo ? (
              <Image src={project.profile_photo} alt={project.player_name} fittingType="fill" className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-foreground/30"><Upload className="h-6 w-6" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Profile picture</p>
            <p className="text-xs text-foreground/45">Shown at the top of your portfolio.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 squircle-sm bg-gradient-to-b from-[#FF7A3E] to-[#FF5A1F] px-3 py-2 text-xs font-semibold text-primary-foreground hover:brightness-105">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
              </label>
              {project.profile_photo && (
                <Button size="sm" variant="ghost" className="text-foreground/55 hover:text-rose-300" onClick={() => patch({ profile_photo: "" })}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <Label className="text-xs text-foreground/55">About me</Label>
          <Textarea rows={5} className="mt-1 border-white/10 bg-white/5" defaultValue={project.bio || ""}
            placeholder="A short bio for coaches — your style of play, strengths, goals…"
            onBlur={(e) => patch({ bio: e.target.value })} />
          <p className="mt-1 text-[11px] text-foreground/45">Saved automatically when you click away.</p>
        </div>

        {/* Featured highlight reel */}
        <div className="mt-6">
          <Label className="text-xs text-foreground/55">Featured highlight reel</Label>
          {reels.length === 0 ? (
            <p className="mt-2 squircle-sm border border-dashed border-white/15 p-4 text-xs text-foreground/45">
              No reels yet. Create one in the Exports tab — then pick it here to feature at the top of your portfolio.
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <Select value={featured?.id || ""} onValueChange={setFeatured}>
                <SelectTrigger className="border-white/10 bg-white/5"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {reels.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.version_label || r.title || "Reel"} · {r.clip_count} clips</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="mt-1 text-[11px] text-foreground/45">The featured reel plays first when a coach opens your link.</p>
        </div>
      </div>

      {/* Share + visibility */}
      <div className="space-y-6">
        <div className="glass squircle-lg p-6">
          <p className="text-[11px] tracking-[0.24em] text-foreground/45">SHAREABLE PORTFOLIO</p>
          <p className="mt-4 break-all squircle-sm border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-foreground/70">{link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={copy} className="">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </Button>
            <a href={`/portfolio/${slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
              <Eye className="h-4 w-4" /> Preview
            </a>
            <Button variant="outline" onClick={ensureSlug} disabled={project.slug} className="border-white/15">
              {project.slug ? <><Check className="mr-2 h-4 w-4" /> Link ready</> : <><ExternalLink className="mr-2 h-4 w-4" /> Create share link</>}
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex items-center justify-between glass squircle-sm px-4 py-3">
              <span className="text-sm">Public portfolio</span>
              <input type="checkbox" checked={project.is_public !== false} onChange={(e) => patch({ is_public: e.target.checked })} className="h-4 w-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between glass squircle-sm px-4 py-3">
              <span className="text-sm">Show my email to coaches</span>
              <input type="checkbox" checked={project.show_email === true} onChange={(e) => patch({ show_email: e.target.checked })} className="h-4 w-4 accent-primary" />
            </label>
          </div>
        </div>

        <div className="glass squircle-lg p-6">
          <p className="text-[11px] tracking-[0.24em] text-foreground/45">COACHES SEE</p>
          <ul className="mt-4 space-y-2 text-sm text-foreground/70">
            {[
              { icon: Star, t: "Profile picture & bio" },
              { icon: Film, t: "Featured highlight reel" },
              { icon: Film, t: "Highlight clips by category" },
              { icon: Film, t: "Full game schedule" },
              { icon: Copy, t: "Contact form (notifies you)" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-2"><x.icon className="h-4 w-4 text-primary" /> {x.t}</li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-foreground/45">
            Coaches do not need an account to view your portfolio or contact you. Your email is only shown if you enable it above.
          </p>
        </div>
      </div>
    </div>
  );
}