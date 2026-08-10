import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function ContactSection({ player }) {
  const [form, setForm] = useState({ coach_name: "", coach_email: "", school: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSending(true);
    try {
      await base44.functions.invoke("submitCoachInquiry", { project_id: player.id, ...form });
      setSent(true);
    } catch (ex) {
      setErr(ex.message || "Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-orange-400" />
        <h2 className="text-[11px] tracking-[0.3em] text-orange-400">CONTACT {player.player_name?.toUpperCase()}</h2>
      </div>
      {sent ? (
        <div className="mt-6 flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-sm font-medium">Your message has been sent.</p>
          <p className="text-xs text-slate-500">{player.player_name} will be notified by email.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-slate-400">Your name</Label>
            <Input required value={form.coach_name} onChange={(e) => set("coach_name", e.target.value)}
              className="mt-1 border-white/10 bg-white/5" placeholder="Coach Smith" />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Your email</Label>
            <Input required type="email" value={form.coach_email} onChange={(e) => set("coach_email", e.target.value)}
              className="mt-1 border-white/10 bg-white/5" placeholder="you@school.edu" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">School / Programme</Label>
            <Input value={form.school} onChange={(e) => set("school", e.target.value)}
              className="mt-1 border-white/10 bg-white/5" placeholder="State University" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Message</Label>
            <Textarea required rows={4} value={form.message} onChange={(e) => set("message", e.target.value)}
              className="mt-1 border-white/10 bg-white/5" placeholder="Hi, I'd love to learn more about your recruiting…" />
          </div>
          {err && <p className="sm:col-span-2 text-xs text-rose-400">{err}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={sending}
              className="w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
              {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SENDING…</> : "SEND MESSAGE"}
            </Button>
          </div>
          {player.email && (
            <p className="sm:col-span-2 text-center text-xs text-slate-500">Or email directly: {player.email}</p>
          )}
        </form>
      )}
    </section>
  );
}