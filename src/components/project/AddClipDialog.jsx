import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function AddClipDialog({ project, games, sources, reload, defaultCategory }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: defaultCategory || "buckets", start: 0, end: 8 });

  const videoOptions = sources.filter((s) => s.status === "ready" || s.status === "error");

  const save = async () => {
    if (!form.video_source_id) return;
    const src = sources.find((s) => s.id === form.video_source_id);
    await base44.entities.Clip.create({
      project_id: project.id,
      game_id: src?.game_id || "",
      video_source_id: form.video_source_id,
      category: form.category,
      description: form.description || "Manually added clip",
      start_seconds: Number(form.start) || 0,
      end_seconds: Number(form.end) || Number(form.start) + 8,
      event_seconds: Number(form.start) + 4,
      confidence: 100,
      status: "accepted",
      order_index: 999,
      detection_source: "manual",
      clip_url: src?.file_url || "",
      processing_status: "ready",
    });
    setOpen(false);
    reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-white/10 hover:bg-white/20"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add clip</Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-slate-950 text-slate-100">
        <DialogHeader><DialogTitle className="tracking-[0.16em]">ADD CLIP MANUALLY</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-slate-400">Video</Label>
            <Select value={form.video_source_id || ""} onValueChange={(v) => setForm({ ...form, video_source_id: v })}>
              <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue placeholder="Choose a video" /></SelectTrigger>
              <SelectContent>
                {videoOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {(games.find((g) => g.id === s.game_id)?.name || "Game") + " — " + (s.title || s.source_type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-400">Start (seconds)</Label>
              <Input type="number" className="mt-1 border-white/10 bg-white/5" value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-slate-400">End (seconds)</Label>
              <Input type="number" className="mt-1 border-white/10 bg-white/5" value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400">Description</Label>
            <Input className="mt-1 border-white/10 bg-white/5" value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button onClick={save} className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
            ADD CLIP
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}