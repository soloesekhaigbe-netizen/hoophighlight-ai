import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Loader2 } from "lucide-react";

export default function InquiriesTab({ project, inquiries, reload }) {
  const [busy, setBusy] = useState(null);

  const setStatus = async (id, status) => {
    setBusy(id);
    try { await base44.entities.CoachInquiry.update(id, { status }); reload(); } finally { setBusy(null); }
  };
  const remove = async (id) => {
    setBusy(id);
    try { await base44.entities.CoachInquiry.delete(id); reload(); } finally { setBusy(null); }
  };

  if (!inquiries || inquiries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center">
        <Mail className="mx-auto h-6 w-6 text-slate-500" />
        <p className="mt-3 text-sm text-slate-400">No coach enquiries yet. Share your portfolio link to get noticed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((q) => (
        <div key={q.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{q.coach_name}</p>
              <p className="text-xs text-slate-500">{q.coach_email}{q.school ? ` · ${q.school}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.18em] ${
                q.status === "new" ? "bg-orange-500/15 text-orange-300" :
                q.status === "replied" ? "bg-emerald-500/15 text-emerald-300" :
                "bg-white/10 text-slate-400"}`}>{q.status.toUpperCase()}</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">{q.message}</p>
          <div className="mt-4 flex gap-2">
            <a href={`mailto:${q.coach_email}`} className="inline-flex">
              <Button size="sm" className="bg-orange-500 text-slate-950 hover:bg-orange-400">
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Reply
              </Button>
            </a>
            {q.status !== "replied" && (
              <Button size="sm" variant="outline" disabled={busy === q.id}
                className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                onClick={() => setStatus(q.id, "replied")}>Mark replied</Button>
            )}
            <Button size="sm" variant="ghost" disabled={busy === q.id}
              className="text-slate-400 hover:text-rose-300"
              onClick={() => remove(q.id)}>
              {busy === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}