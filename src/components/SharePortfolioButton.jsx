import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { portfolioLink } from "@/lib/portfolio";
import { useToast } from "@/components/ui/use-toast";

export default function SharePortfolioButton({ project, variant = "outline", label = "Share" }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  if (!project) return null;

  const share = async () => {
    const url = portfolioLink(project);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${project.player_name || "Player"} — Recruiting Portfolio`, url });
        return;
      } catch (_) { /* user cancelled */ }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Paste it anywhere to share your portfolio." });
    } catch (_) {
      toast({ title: url, description: "Copy this link to share your portfolio." });
    }
  };

  return (
    <Button onClick={share} variant={variant} className="border-white/15">
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}