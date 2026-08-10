import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, ExternalLink, Eye, Loader2, Check } from "lucide-react";
import { portfolioLink } from "@/lib/portfolio";

export default function PortfolioTab({ project, reload }) {
  const [copied, setCopied] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const link = portfolioLink(project);
  const slug = project.slug || project.id;

  const copy = async () => {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ensureSlug = async () => {
    if (project.slug) return;
    setSavingSlug(true);
    const base = (project.player_name || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    const newSlug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    await base44.entities.Project.update(project.id, { slug: newSlug });
    await reload();
    setSavingSlug(false);
  };

  const togglePublic = async (v) => {
    await base44.entities.Project.update(project.id, { is_public: v });
    await reload();
  };
  const toggleShowEmail = async (v) => {
    await base44.entities.Project.update(project.id, { show_email: v });
    await reload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
        <p className="text-[11px] tracking-[0.24em] text-slate-500">SHAREABLE PORTFOLIO</p>
        <p className="mt-4 break-all rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-slate-300">{link}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={copy} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />} {copied ? "Copied" : "Copy link"}
          </Button>
          <a href={`/portfolio/${slug}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/10">
            <Eye className="h-4 w-4" /> Preview
          </a>
          <Button variant="outline" onClick={ensureSlug} disabled={savingSlug} className="border-white/15">
            {savingSlug ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />} {project.slug ? "Link ready" : "Create share link"}
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
            <span className="text-sm">Public portfolio</span>
            <input type="checkbox" checked={project.is_public !== false} onChange={(e) => togglePublic(e.target.checked)} className="h-4 w-4 accent-orange-500" />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
            <span className="text-sm">Show my email to coaches</span>
            <input type="checkbox" checked={project.show_email === true} onChange={(e) => toggleShowEmail(e.target.checked)} className="h-4 w-4 accent-orange-500" />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
        <p className="text-[11px] tracking-[0.24em] text-slate-500">COACHES SEE</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {["Profile & bio", "Academic information", "Highlight clips by category", "Game schedule", "Contact form (notifies you)"].map((x) => (
            <li key={x} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {x}</li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-slate-500">
          Coaches do not need an account to view your portfolio or contact you. Your email is only shown if you enable it above.
        </p>
      </div>
    </div>
  );
}