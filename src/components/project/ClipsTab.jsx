import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/ui/mobile-select";
import ClipCard from "@/components/project/ClipCard";
import ManualClipper from "@/components/project/ManualClipper";
import ClipExtractionRunner from "@/components/project/ClipExtractionRunner";
import { CATEGORIES } from "@/lib/categories";
import { Trash2, Search, Star, Film } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ClipsTab({ project, games, sources, clips, tapes, reload, lockedCategory }) {
  const [gameFilter, setGameFilter] = useState("all");
  const [catFilter, setCatFilter] = useState(lockedCategory || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("order");
  const [search, setSearch] = useState("");
  const [favesOnly, setFavesOnly] = useState(false);
  const [reelFilter, setReelFilter] = useState("all");
  const [selected, setSelected] = useState({});
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Every clip id that appears in any mix reel.
  const reelClipIds = useMemo(() => {
    const s = new Set();
    (tapes || []).filter((t) => t.category === "mix").forEach((t) => (t.clip_ids || []).forEach((id) => s.add(id)));
    return s;
  }, [tapes]);

  const visible = useMemo(() => {
    let list = clips.slice();
    if (lockedCategory) list = list.filter((c) => c.category === lockedCategory);
    else if (catFilter !== "all") list = list.filter((c) => c.category === catFilter);
    if (gameFilter !== "all") list = list.filter((c) => c.game_id === gameFilter);
    if (statusFilter !== "all") list = list.filter((c) => (c.status || "pending") === statusFilter);
    if (favesOnly) list = list.filter((c) => c.favourite);
    if (reelFilter === "used") list = list.filter((c) => reelClipIds.has(c.id));
    else if (reelFilter === "unused") list = list.filter((c) => !reelClipIds.has(c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        [c.description, c.play_type, c.category, games.find((g) => g.id === c.game_id)?.name, games.find((g) => g.id === c.game_id)?.opponent]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    const gameOf = (c) => games.find((g) => g.id === c.game_id);
    if (sort === "date") list.sort((a, b) => (gameOf(a)?.game_date || "").localeCompare(gameOf(b)?.game_date || ""));
    else if (sort === "game") list.sort((a, b) => (gameOf(a)?.name || "").localeCompare(gameOf(b)?.name || ""));
    else if (sort === "confidence") list.sort((a, b) => (b.highlight_score || b.confidence || 0) - (a.highlight_score || a.confidence || 0));
    else list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    return list;
  }, [clips, games, gameFilter, catFilter, statusFilter, sort, lockedCategory, search, favesOnly, reelFilter, reelClipIds]);

  const selectedIds = visible.filter((c) => selected[c.id]).map((c) => c.id);
  const allSelected = visible.length > 0 && selectedIds.length === visible.length;

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (allSelected) setSelected((s) => { const n = { ...s }; visible.forEach((c) => { delete n[c.id]; }); return n; });
    else setSelected((s) => { const n = { ...s }; visible.forEach((c) => { n[c.id] = true; }); return n; });
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
    try {
      await base44.entities.Clip.bulkUpdate(visible.map((c) => ({ id: c.id, status })));
      toast({ title: `${visible.length} clip${visible.length > 1 ? "s" : ""} ${status}` });
      reload();
    } catch (e) {
      toast({ title: "Could not update clips", description: e?.message, variant: "destructive" });
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || deleting) return;
    if (!window.confirm(`Delete ${selectedIds.length} clip${selectedIds.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.Clip.deleteMany({ id: { $in: selectedIds } });
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

      {/* Search + favourites */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
          <Input className="w-full pl-9" placeholder="Search clips…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant={favesOnly ? "default" : "outline"}
          onClick={() => setFavesOnly((v) => !v)}>
          <Star className={`mr-1.5 h-3.5 w-3.5 ${favesOnly ? "fill-current" : ""}`} /> Favourites
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MobileSelect
          value={gameFilter} onValueChange={setGameFilter} placeholder="Game" title="Game"
          triggerClassName="w-full"
          options={[{ value: "all", label: "All games" }, ...games.map((g) => ({ value: g.id, label: g.name }))]}
        />
        {!lockedCategory && (
          <MobileSelect
            value={catFilter} onValueChange={setCatFilter} title="Category"
            triggerClassName="w-full"
            options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c.key, label: `${c.emoji} ${c.label}` }))]}
          />
        )}
        <MobileSelect
          value={statusFilter} onValueChange={setStatusFilter} title="Status"
          triggerClassName="w-full"
          options={[
            { value: "all", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <MobileSelect
          value={reelFilter} onValueChange={setReelFilter} title="Reel"
          triggerClassName="w-full"
          options={[
            { value: "all", label: "In any reel" },
            { value: "used", label: "Used in reel" },
            { value: "unused", label: "Unused" },
          ]}
        />
        <MobileSelect
          value={sort} onValueChange={setSort} title="Sort"
          triggerClassName="w-full"
          options={[
            { value: "order", label: "Manual order" },
            { value: "game", label: "By game" },
            { value: "date", label: "By date" },
            { value: "confidence", label: "By score" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {visible.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-foreground/70">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-primary" /> Select all
          </label>
        )}
        {selectedIds.length > 0 && (
          <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={deleting}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete {selectedIds.length}
          </Button>
        )}
        <Button size="sm" variant="outline" className="" onClick={() => bulk("accepted")}>Accept all shown</Button>
        <Button size="sm" variant="outline" className="" onClick={() => bulk("rejected")}>Reject all shown</Button>
        <div className="ml-auto">
          <ManualClipper project={project} games={games} sources={sources} reload={reload} defaultCategory={lockedCategory} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="glass squircle-lg border-dashed border-white/15 p-14 text-center">
          <Film className="mx-auto h-10 w-10 text-foreground/45" />
          <p className="mt-4 font-heading text-lg">No clips match</p>
          <p className="mt-1 text-sm text-foreground/55">Try clearing filters or uploading a game.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((c) => (
            <div key={c.id} className="flex gap-3">
              <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggle(c.id)} className="mt-3 h-4 w-4 shrink-0 accent-primary" aria-label="Select clip" />
              <div className="min-w-0 flex-1">
                <ClipCard clip={c} reload={reload} project={project} tapes={tapes}
                  source={sources.find((s) => s.id === c.video_source_id)} game={games.find((g) => g.id === c.game_id)} onMove={(dir) => move(c, dir)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}