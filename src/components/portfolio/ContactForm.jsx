import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ContactForm({ projectId }) {
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
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-3 text-lg font-semibold text-emerald-800">Message sent</p>
        <p className="mt-1 text-sm text-emerald-700">The player has been notified and will reply to you at {form.coach_email}.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Contact player</h2>
      <p className="mt-1 text-sm text-slate-500">Send a message — the player is notified directly.</p>
      <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-slate-500">Your name</Label>
          <Input className="mt-1" value={form.coach_name} onChange={(e) => set("coach_name", e.target.value)} placeholder="Coach Smith" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">School / programme</Label>
          <Input className="mt-1" value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="State University" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-500">Email</Label>
          <Input className="mt-1" type="email" value={form.coach_email} onChange={(e) => set("coach_email", e.target.value)} placeholder="coach@school.edu" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-slate-500">Message</Label>
          <Textarea rows={4} className="mt-1" value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Interested in learning more about your game — can we set up a call?" />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-rose-600">{error}</p>}
        <div className="sm:col-span-2">
          <Button onClick={submit} disabled={busy} className="bg-slate-900 text-white hover:bg-slate-700">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Send message
          </Button>
        </div>
      </div>
    </section>
  );
}