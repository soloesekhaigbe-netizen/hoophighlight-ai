import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const LENGTHS = ["30 seconds", "60 seconds", "90 seconds", "2 minutes", "3 minutes", "5 minutes"];
const STYLES = ["Professional Recruiting", "Fast/Punchy", "Clean", "Cinematic", "Minimal"];
const SELECTIONS = [
  { key: "best", label: "Best clips" },
  { key: "all", label: "All clips" },
  { key: "highest", label: "Highest scores" },
  { key: "manual", label: "Manual selection" },
];
const INCLUDE_OPTIONS = [
  { key: "player_name", label: "Player name" },
  { key: "jersey_number", label: "Jersey number" },
  { key: "team_name", label: "Team name" },
  { key: "opponent", label: "Opponent" },
  { key: "game_date", label: "Game date" },
  { key: "intro", label: "Intro" },
  { key: "outro", label: "Outro" },
  { key: "clip_labels", label: "Clip labels" },
];

export default function CreateReelDialog({ project, games, clips, reload, trigger, presetGameIds }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedGames, setSelectedGames] = useState(presetGameIds || []);
  const [length, setLength] = useState("60 seconds");
  const [selection, setSelection] = useState("best");
  const [style, setStyle] = useState("Professional Recruiting");
  const [manualClipIds, setManualClipIds] = useState([]);
  const [includes, setIncludes] = useState({
    player_name: true, jersey_number: true, team_name: true,
    opponent: true, game_date: true, intro: true, outro: true, clip_labels: true,
  });
  const { toast } = useToast();

  const acceptedClips = clips.filter((c) => c.status === "accepted" && c.processing_status === "ready");
  const playableGames = games.filter((g) => acceptedClips.some((c) => c.game_id === g.id));
  const allGamesSelected = selectedGames.length === 0 || selectedGames.length === playableGames.length;

  const toggleGame = (id) => setSelectedGames((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleClip = (id) => setManualClipIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleInclude = (key) => setIncludes((s) => ({ ...s, [key]: !s[key] }));

  const generate = async () => {
    if (selection === "manual" && !manualClipIds.length) {
      toast({ variant: "destructive", title: "Select at least one clip", description: "Pick clips to include in the reel." });
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke("generateHighlightReel", {
        project_id: project.id,
        game_ids: allGamesSelected ? [] : selectedGames,
        clip_ids: selection === "manual" ? manualClipIds : undefined,
        settings: { reel_length: length, selection_mode: selection, style, include_fields: includes },
      });
      toast({ title: "Highlight reel created", description: `${res.data?.clip_count || 0} clips sequenced and ranked.` });
      setOpen(false);
      setSelectedGames([]);
      setManualClipIds([]);
      reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Could not create reel", description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && presetGameIds) setSelectedGames(presetGameIds); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11 px-7">
            <Sparkles className="mr-2 h-4 w-4" /> CREATE HIGHLIGHT REEL
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">✨ CREATE HIGHLIGHT REEL</DialogTitle></DialogHeader>

        {!playableGames.length ? (
          <p className="text-sm text-foreground/55">No accepted clips yet. Upload a game and accept some clips first.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-foreground/55">Games ({allGamesSelected ? "All" : selectedGames.length} selected)</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {playableGames.map((g) => {
                  const on = allGamesSelected || selectedGames.includes(g.id);
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGame(g.id)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${on ? "border-primary/50 bg-primary/10" : "border-white/10 hover:bg-white/10"}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded ${on ? "bg-primary text-primary-foreground" : "border border-white/20"}`}>{on && <Check className="h-3 w-3" />}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{g.name}</span>
                        <span className="text-[11px] text-foreground/45">{acceptedClips.filter((c) => c.game_id === g.id).length} clips</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-foreground/45">Leave all unselected to use every game.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label className="text-xs text-foreground/55">Reel length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="mt-1 "><SelectValue /></SelectTrigger>
                  <SelectContent>{LENGTHS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-foreground/55">Clip selection</Label>
                <Select value={selection} onValueChange={setSelection}>
                  <SelectTrigger className="mt-1 "><SelectValue /></SelectTrigger>
                  <SelectContent>{SELECTIONS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-foreground/55">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1 "><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selection === "manual" && (
              <div className="max-h-48 space-y-1 overflow-y-auto squircle-sm border border-white/10 p-2">
                {acceptedClips.map((c) => {
                  const g = games.find((x) => x.id === c.game_id);
                  const on = manualClipIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggleClip(c.id)}
                      className={`flex w-full items-center justify-between squircle-sm p-2 text-left text-sm ${on ? "bg-primary/15" : "hover:bg-white/10"}`}>
                      <span className="min-w-0 truncate">{c.play_type || c.description || c.category}{g ? ` · ${g.name}` : ""}</span>
                      {on && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <Label className="text-xs text-foreground/55">Include</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INCLUDE_OPTIONS.map((o) => {
                  const on = includes[o.key];
                  return (
                    <button key={o.key} type="button" onClick={() => toggleInclude(o.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${on ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 text-foreground/55 hover:bg-white/10"}`}>
                      {on && <Check className="mr-1 inline h-3 w-3" />}{o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={generate} disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {busy ? "GENERATING…" : "GENERATE REEL"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}