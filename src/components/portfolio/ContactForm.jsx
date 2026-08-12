import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";

// Coach contact form. Fields, validation and submission logic unchanged.
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

  return (
    <section id="contact" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-6 border-b border-white/10 pb-4">
        <div>
          <p className="label-xs text-primary">Contact</p>
          <h2 className="mt-2 display-xl text-4xl sm:text-6xl">{player?.player_name || "the player"}</h2>
        </div>
      </div>

      {sent ? (
        <div className="mt-6 flex items-center gap-3 squircle-lg border border-emerald-500/30 bg-emerald-500/10 p-6">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
          <div>
            <p className="font-heading text-sm font-semibold text-emerald-200">Your message has been sent.</p>
            <p className="text-xs text-foreground/60">{player?.player_name} will be notified by email.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="label-xs text-foreground/55">Your name</Label>
            <Input required value={form.coach_name} onChange={(e) => set("coach_name", e.target.value)} className="mt-2 h-12" placeholder="Coach Smith" />
          </div>
          <div>
            <Label className="label-xs text-foreground/55">Your email</Label>
            <Input required type="email" value={form.coach_email} onChange={(e) => set("coach_email", e.target.value)} className="mt-2 h-12" placeholder="you@school.edu" />
          </div>
          <div className="sm:col-span-2">
            <Label className="label-xs text-foreground/55">School / programme</Label>
            <Input value={form.school} onChange={(e) => set("school", e.target.value)} className="mt-2 h-12" placeholder="State University" />
          </div>
          <div className="sm:col-span-2">
            <Label className="label-xs text-foreground/55">Message</Label>
            <Textarea required rows={4} value={form.message} onChange={(e) => set("message", e.target.value)} className="mt-2" placeholder="Hi, I'd love to learn more about your recruiting…" />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-primary">{error}</p>}
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4">
            <Button onClick={submit} disabled={busy} size="lg">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send message <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {player?.email && (
              <p className="text-xs text-foreground/45">
                Or email directly:{" "}
                <a
                  href={`mailto:${player.email}`}
                  className="underline decoration-white/30 hover:text-primary"
                  onClick={() => base44.functions.invoke("trackPortfolioEvent", { project_id: projectId, event_type: "link_click" }).catch(() => {})}
                >
                  {player.email}
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}