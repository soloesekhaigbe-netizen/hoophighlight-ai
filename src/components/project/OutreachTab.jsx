import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slugify, publicPortfolioUrl } from "@/lib/slugify";
import { Mail, Loader2, Plus, Trash2, Send } from "lucide-react";

const STATUS_STYLE = {
  not_contacted: "bg-white/10 text-slate-400",
  sent: "bg-orange-500/15 text-orange-300",
  opened: "bg-sky-500/15 text-sky-300",
  replied: "bg-emerald-500/15 text-emerald-300",
  interested: "bg-emerald-500/15 text-emerald-300",
  not_interested: "bg-rose-500/15 text-rose-300",
};

export default function OutreachTab({ project, coaches, reload }) {
  const [form, setForm] = useState({ name: "", email: "", school: "", role: "" });
  const [compose, setCompose] = useState(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addCoach = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    await base44.entities.Coach.create({ project_id: project.id, ...form, status: "not_contacted" });
    setForm({ name: "", email: "", school: "", role: "" });
    reload();
  };

  const removeCoach = async (id) => { await base44.entities.Coach.delete(id); reload(); };
  const setStatus = async (id, status) => { await base44.entities.Coach.update(id, { status }); reload(); };

  const defaultSubject = `Highlight tape — ${project.player_name} #${project.jersey_number}`;
  const defaultBody = (coachName) => `Hi Coach ${coachName || ""},\n\nI'm reaching out to share my highlight tape and portfolio.\n${publicPortfolioUrl(project.slug || slugify(project.player_name))}\n\nThank you for your time,\n${project.player_name}`;

  const send = async () => {
    setErr(null); setSending(true);
    try {
      await base44.functions.invoke("sendCoachEmail", {
        coach_id: compose.coach_id, coach_email: compose.to, subject: compose.subject, body: compose.body
      });
      setCompose(null); reload();
    } catch (ex) { setErr(ex.message || "Send failed"); }
    finally { setSending(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-4">
        <form onSubmit={addCoach} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">ADD A COACH</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><Label className="text-xs text-slate-400">Name</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label className="text-xs text-slate-400">Email</Label>
              <Input className="mt-1 border-white/10 bg-white/5" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><Label className="text-xs text-slate-400">School</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.school} onChange={(e) => set("school", e.target.value)} /></div>
            <div><Label className="text-xs text-slate-400">Role</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Head Coach" /></div>
          </div>
          <Button type="submit" size="sm" className="mt-3 bg-orange-500 text-slate-950 hover:bg-orange-400">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </form>

        <div className="space-y-2">
          {coaches.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No coaches added yet.</p>
          ) : coaches.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.email}{c.school ? ` · ${c.school}` : ""}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.18em] ${STATUS_STYLE[c.status] || "bg-white/10 text-slate-400"}`}>
                  {(c.status || "not_contacted").toUpperCase().replace("_", " ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400"
                  onClick={() => setCompose({ coach_id: c.id, to: c.email, subject: defaultSubject, body: defaultBody(c.name) })}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Compose
                </Button>
                <Select value={c.status} onValueChange={(v) => setStatus(c.id, v)}>
                  <SelectTrigger className="h-8 w-36 border-white/10 bg-white/5 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["not_contacted", "sent", "opened", "replied", "follow_up", "interested", "not_interested"].map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-rose-300" onClick={() => removeCoach(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {compose && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] tracking-[0.24em] text-slate-500">COMPOSE OUTREACH</p>
          <div className="mt-3 space-y-3">
            <div><Label className="text-xs text-slate-400">To</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={compose.to}
                onChange={(e) => setCompose({ ...compose, to: e.target.value })} /></div>
            <div><Label className="text-xs text-slate-400">Subject</Label>
              <Input className="mt-1 border-white/10 bg-white/5" value={compose.subject}
                onChange={(e) => setCompose({ ...compose, subject: e.target.value })} /></div>
            <div><Label className="text-xs text-slate-400">Message</Label>
              <Textarea rows={8} className="mt-1 border-white/10 bg-white/5" value={compose.body}
                onChange={(e) => setCompose({ ...compose, body: e.target.value })} /></div>
            {err && <p className="text-xs text-rose-400">{err}</p>}
            <p className="text-[11px] text-slate-500">Review the email before sending. You confirm this outreach.</p>
            <div className="flex gap-2">
              <Button onClick={send} disabled={sending} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send email
              </Button>
              <Button variant="ghost" onClick={() => setCompose(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}