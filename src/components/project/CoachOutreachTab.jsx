import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, Trash2, Info } from "lucide-react";

const STATUSES = [
  ["not_contacted", "Not contacted"], ["draft", "Draft"], ["sent", "Sent"],
  ["opened", "Opened"], ["replied", "Replied"], ["follow_up", "Follow up"],
  ["interested", "Interested"], ["not_interested", "Not interested"],
];

export default function CoachOutreachTab({ project, coaches = [], reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", school: "", role: "", email: "", notes: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const add = async () => {
    if (!form.name || !form.email) return;
    await base44.entities.Coach.create({ project_id: project.id, ...form, status: "not_contacted" });
    setForm({ name: "", school: "", role: "", email: "", notes: "" });
    setOpen(false);
    reload();
  };
  const patch = async (id, data) => { await base44.entities.Coach.update(id, data); reload(); };
  const remove = async (id) => { await base44.entities.Coach.delete(id); reload(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading text-xl font-semibold">Coach outreach</p>
          <p className="mt-1 text-sm text-slate-400">Track the coaches you are reaching out to.</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
          <Plus className="mr-2 h-4 w-4" /> Add coach
        </Button>
      </div>

      <div className="flex gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3 text-xs text-sky-200">
        <Info className="h-4 w-4 shrink-0" />
        <span>Compose your message and email the coach from your own inbox, then mark the status "Sent" here to keep your outreach organised. Coaches who find your public portfolio can contact you through the portfolio form.</span>
      </div>

      {open && (
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2">
          <div><Label className="text-xs text-slate-400">Name</Label><Input className="mt-1 border-white/10 bg-white/5" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label className="text-xs text-slate-400">School</Label><Input className="mt-1 border-white/10 bg-white/5" value={form.school} onChange={(e) => set("school", e.target.value)} /></div>
          <div><Label className="text-xs text-slate-400">Role</Label><Input className="mt-1 border-white/10 bg-white/5" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Head coach" /></div>
          <div><Label className="text-xs text-slate-400">Email</Label><Input className="mt-1 border-white/10 bg-white/5" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label className="text-xs text-slate-400">Notes</Label><Textarea rows={2} className="mt-1 border-white/10 bg-white/5" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="sm:col-span-2"><Button onClick={add} className="bg-orange-500 text-slate-950 hover:bg-orange-400">Save coach</Button></div>
        </div>
      )}

      {coaches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-14 text-center text-sm text-slate-400">No coaches added yet.</div>
      ) : (
        <div className="space-y-3">
          {coaches.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.school || "—"}{c.role ? ` · ${c.role}` : ""}</p>
                  <a href={`mailto:${c.email}`} className="mt-1 inline-flex items-center gap-1 text-xs text-orange-400 hover:underline"><Mail className="h-3 w-3" /> {c.email}</a>
                  {c.notes && <p className="mt-2 text-xs text-slate-400">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={c.status} onValueChange={(v) => patch(c.id, { status: v })}>
                    <SelectTrigger className="h-8 w-36 border-white/10 bg-white/5 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="text-slate-500 hover:text-rose-400" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}