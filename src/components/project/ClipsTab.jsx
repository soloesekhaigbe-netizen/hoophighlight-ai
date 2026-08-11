import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClipCard from "@/components/project/ClipCard";
import ManualClipper from "@/components/project/ManualClipper";
import ClipExtractionRunner from "@/components/project/ClipExtractionRunner";
import { CATEGORIES } from "@/lib/categories";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ClipsTab({ project, games, sources, clips, reload, lockedCategory }) {
  const [gameFilter, setGameFilter] = useState("all");
  const [catFilter, setCatFilter] = useState(lockedCategory || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("order");
  const [selected, setSelected] = useState({});
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const visible = useMemo(() => {
    let list = clips.slice();
    if (lockedCategory) list = list.filter((c) => c.category === lockedCategory);
    else if (catFilter !== "all") list = list.filter((c) => c.category === catFilter);
    if (gameFilter !== "all") list = list.filter((c) => c.game_id === gameFilter);
    if (statusFilter !== "all") list = list.filter((c) => (c.status || "pending") === statusFilter);
    const gameOf = (c) => games.find((g) => g.id === c.game_id);
    if (sort === "date") list.sort((a, b) => (gameOf(a)?.game_date || "").localeCompare(gameOf(b)?.game_date || ""));
    else if (sort === "game") list.sort((a, b) => (gameOf(a)?.name || "").localeCompare(gameOf(b)?.name || ""));
    else if (sort === "confidence") list.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    else list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    return list;
  }, [clips, games, gameFilter, catFilter, statusFilter, sort, lockedCategory]);

  const selectedIds = visible.filter((c) => selected[c.id]).map((c) => c.id);
  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (allSelected) setSelected((s) => {
      const next = { ...s };
      visible.forEach((c) => { delete next[c.id]; });
      return next;
    });
    else setSelected((s) => {
      const next = { ...s };
      visible.forEach((c) => { next[c.id] = true; });
      return next;
    });
  };

  const move = async (clip, dir) => {
    const idx = visible.findIndex((c) => c.id === clip.id);
    const other = visible[idx + dir];
    if (!other) return;
    await base44.entities.Clip.update(clip.id, { order_index: other.order_index || 0 });
    await base44.entities.Clip.update(other.id, { order_index: clip.order_index || 0 });
    reload();
  };

  const bulk = async (status) => {
    for (const c of visible) await base44.entities.Clip.update(c.id, { status });
    reload();
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0 || deleting) return;
    if (!window.confirm(`Delete ${selectedIds.length} clip${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => base44.entities.Clip.delete(id)));
      setSelected({});
      await reload();
      toast({ title: `${selectedIds.length} clip${selectedIds.length > 1 ? "s" : ""} deleted` });
    } catch (e) {
      toast({ title: "Could not delete clips", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ClipExtractionRunner clips={clips} sources={sources} reload={reload} />
      <div className="flex flex-wrap items-center gap-3">
        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-44 border-white/10 bg-white/5"><SelectValue placeholder="Game" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All games</SelectItem>
            {games.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {!lockedCategory && (
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-44 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40 border-white/10 bg-white/5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Manual order</SelectItem>
            <SelectItem value="game">By game</SelectItem>
            <SelectItem value="date">By date</SelectItem>
            <SelectItem value="confidence">By confidence</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {visible.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-orange-500" />
              Select all
            </label>
          )}
          {selectedIds.length > 0 && (
            <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={deleting}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete {selectedIds.length}
            </Button>
          )}
          <Button size="sm" variant="outline" className="border-white/15 bg-transparent" onClick={() => bulk("accepted")}>Accept all shown</Button>
          <ManualClipper project={project} games={games} sources={sources} reload={reload} defaultCategory={lockedCategory} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center text-sm text-slate-400">
          No clips match these filters.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((c) => (
            <div key={c.id} className="flex gap-3">
              <input
                type="checkbox"
                checked={!!selected[c.id]}
                onChange={() => toggle(c.id)}
                className="mt-3 h-4 w-4 shrink-0 accent-orange-500"
                aria-label="Select clip"
              />
              <div className="min-w-0 flex-1">
                <ClipCard clip={c} reload={reload}
                  project={project}
                  source={sources.find((s) => s.id === c.video_source_id)}
                  game={games.find((g) => g.id === c.game_id)}
                  onMove={(dir) => move(c, dir)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}