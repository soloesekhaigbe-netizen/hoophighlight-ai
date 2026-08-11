import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

// Visual-only redesign of the existing public contact form. Fields, validation
// and submission logic are unchanged.
export default function ContactForm({ projectId, player }) {
  const [form, setForm] = useState({ coach_name: "", coach_email: "", school: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.coach_name || !form.coach_email || !form.message) {
      setError("Name, email and message are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("submitCoachInquiry", { project_id: projectId, ...form });
      setSent(true);
    } catch (e) {
      setError(e.message || "Could not send. Please try again.");
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
        <p className="mt-3 font-heading text-lg font-semibold text-emerald-300">Message sent</p>
        <p className="mt-1 text-sm text-slate-400">The player has been notified and will reply to you at {form.coach_email}.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.03] p-6 sm:p-8">
      <h2 className="text-[11px] tracking-[0.3em] text-orange-400">CONTACT {player?.player_name?.toUpperCase()}</h2>
      <p className="mt-2 text-sm text-slate-400">Send a message — the player is notified directly.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-slate-400">Your name</Label>
          <Input required value={form.coach_name} onChange={(e) => set("coach_name", e.target.value)}
            className="mt-1.5 h-11 border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500" placeholder="Coach Smith" />
        </div>
        <div>
          <Label className="text-xs text-slate-400">School / programme</Label>
          <Input value={form.school} onChange={(e) => set("school", e.target.value)}
            className="mt-1.5 h-11 border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500" placeholder="State University" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-400">Email</Label>
          <Input required type="email" value={form.coach_email} onChange={(e) => set("coach_email", e.target.value)}
            className="mt-1.5 h-11 border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500" placeholder="coach@school.edu" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-400">Message</Label>
          <Textarea required rows={4} value={form.message} onChange={(e) => set("message", e.target.value)}
            className="mt-1.5 border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500" placeholder="Interested in learning more about your game — can we set up a call?" />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-rose-400">{error}</p>}
        <div className="sm:col-span-2">
          <Button onClick={submit} disabled={busy}
            className="h-11 w-full bg-orange-500 font-semibold tracking-widest text-slate-950 hover:bg-orange-400">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SENDING…</> : "SEND MESSAGE"}
          </Button>
        </div>
        {player?.email && (
          <p className="sm:col-span-2 text-center text-xs text-slate-500">Or email directly: {player.email}</p>
        )}
      </div>
    </section>
  );
}