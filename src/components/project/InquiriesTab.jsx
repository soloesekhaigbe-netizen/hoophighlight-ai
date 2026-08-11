import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Archive, CheckCheck, Eye } from "lucide-react";

const STATUS_CLS = {
  new: "bg-orange-500/15 text-orange-300",
  read: "bg-sky-500/15 text-sky-300",
  replied: "bg-emerald-500/15 text-emerald-300",
  archived: "bg-slate-500/15 text-foreground/55",
};

export default function InquiriesTab({ inquiries = [], reload }) {
  const patch = async (id, status) => { await base44.entities.CoachInquiry.update(id, { status }); reload(); };

  return (
    <div className="space-y-5">
      <div>
        <p className="font-heading text-xl font-semibold">Coach inquiries</p>
        <p className="mt-1 text-sm text-foreground/55">Messages submitted through your public portfolio.</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="glass squircle-lg border-dashed border-white/15 p-14 text-center text-sm text-foreground/55">
          No inquiries yet. Share your portfolio with coaches to receive messages here.
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((q) => (
            <div key={q.id} className="glass squircle p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{q.coach_name}</p>
                  <p className="text-xs text-foreground/45">{q.school || "—"}{q.coach_email ? ` · ${q.coach_email}` : ""}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] ${STATUS_CLS[q.status] || STATUS_CLS.new}`}>{q.status?.toUpperCase()}</span>
              </div>
              <p className="mt-3 text-sm text-foreground/80">{q.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${q.coach_email}`}><Button size="sm" className=""><Mail className="mr-1.5 h-3.5 w-3.5" /> Reply</Button></a>
                <Button size="sm" variant="outline" className="" onClick={() => patch(q.id, "read")}><Eye className="mr-1.5 h-3.5 w-3.5" /> Mark read</Button>
                <Button size="sm" variant="outline" className="" onClick={() => patch(q.id, "replied")}><CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Replied</Button>
                <Button size="sm" variant="ghost" className="text-foreground/45" onClick={() => patch(q.id, "archived")}><Archive className="mr-1.5 h-3.5 w-3.5" /> Archive</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}