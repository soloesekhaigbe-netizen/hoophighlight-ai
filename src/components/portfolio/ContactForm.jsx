import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

// Editorial contact section. Fields, validation and submission logic unchanged.
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
      <div className="animate-slide-up border-2 border-sun p-10 text-center sm:p-16">
        <CheckCircle2 className="mx-auto h-10 w-10 text-sun" />
        <p className="mt-4 font-display text-4xl uppercase sm:text-6xl">Message sent.</p>
        <p className="mt-3 text-paper/70">The player has been notified and will reply to you at {form.coach_email}.</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <p className="label-xs text-sun">Contact</p>
      <h2 className="mt-3 display-xl text-5xl sm:text-8xl">Let's<br />talk.</h2>
      <p className="mt-5 max-w-md text-paper/70">Send a message — {player?.player_name || "the player"} is notified directly.</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div>
          <Label className="label-xs text-paper/60">Your name</Label>
          <Input required value={form.coach_name} onChange={(e) => set("coach_name", e.target.value)}
            className="mt-2 h-12 rounded-none border-2 border-paper/25 bg-transparent text-paper placeholder:text-paper/30 focus-visible:ring-sun"
            placeholder="Coach Smith" />
        </div>
        <div>
          <Label className="label-xs text-paper/60">School / programme</Label>
          <Input value={form.school} onChange={(e) => set("school", e.target.value)}
            className="mt-2 h-12 rounded-none border-2 border-paper/25 bg-transparent text-paper placeholder:text-paper/30 focus-visible:ring-sun"
            placeholder="State University" />
        </div>
        <div className="sm:col-span-2">
          <Label className="label-xs text-paper/60">Email</Label>
          <Input required type="email" value={form.coach_email} onChange={(e) => set("coach_email", e.target.value)}
            className="mt-2 h-12 rounded-none border-2 border-paper/25 bg-transparent text-paper placeholder:text-paper/30 focus-visible:ring-sun"
            placeholder="coach@school.edu" />
        </div>
        <div className="sm:col-span-2">
          <Label className="label-xs text-paper/60">Message</Label>
          <Textarea required rows={5} value={form.message} onChange={(e) => set("message", e.target.value)}
            className="mt-2 rounded-none border-2 border-paper/25 bg-transparent text-paper placeholder:text-paper/30 focus-visible:ring-sun"
            placeholder="Interested in learning more about your game — can we set up a call?" />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-flame">{error}</p>}
        <div className="sm:col-span-2">
          <Button onClick={submit} disabled={busy}
            className="h-12 w-full rounded-none bg-sun py-3.5 font-heading text-sm font-semibold uppercase tracking-[0.18em] text-ink hover:bg-sun-deep">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <>Send message <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
        {player?.email && (
          <p className="sm:col-span-2 text-center text-xs text-paper/40">Or email directly: {player.email}</p>
        )}
      </div>
    </div>
  );
}