import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";

const COMPONENTS = [
  ["database", "Database / entity storage"],
  ["file_storage", "Video & clip file storage"],
  ["video_analysis", "Vision analysis (player & event detection)"],
  ["clip_extraction", "Clip extraction engine (browser MediaRecorder)"],
  ["clip_storage", "Extracted clip file storage"],
  ["email", "Player email notifications"],
  ["highlight_generation", "Highlight tape generation"],
  ["portfolio", "Public portfolio serving"],
];

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("systemHealth", {});
      setData(res.data);
    } catch (e) {
      setData({ error: e.message });
    }
    setBusy(false);
  };

  const item = (key) => (data && data.results ? data.results[key] : { status: "NOT_TESTED", detail: "Not run yet." });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] tracking-[0.3em] text-orange-400">ADMIN</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">Video System Health</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Real probes of each subsystem. No component is shown as WORKING unless the operation actually succeeded.
        </p>
      </div>

      <Button onClick={run} disabled={busy} className="bg-orange-500 text-slate-950 hover:bg-orange-400">
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> TESTING…</> : <><Activity className="mr-2 h-4 w-4" /> RUN FULL SYSTEM TEST</>}
      </Button>

      {data && data.summary && (
        <div className="flex gap-4 text-sm">
          <span className="text-emerald-400">{data.summary.working} working</span>
          <span className="text-rose-400">{data.summary.not_working} not working</span>
          <span className="text-slate-400">{data.summary.not_tested} not tested</span>
        </div>
      )}

      <div className="grid gap-3">
        {COMPONENTS.map(([key, label]) => {
          const r = item(key);
          const Icon = r.status === "WORKING" ? CheckCircle2 : r.status === "NOT_WORKING" ? XCircle : MinusCircle;
          const tone = r.status === "WORKING" ? "text-emerald-400" : r.status === "NOT_WORKING" ? "text-rose-400" : "text-slate-400";
          return (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${tone}`} />
                <p className="text-sm font-medium">{label}</p>
              </div>
              <div className="max-w-md text-right">
                <p className={`text-[11px] font-semibold tracking-[0.18em] ${tone}`}>{r.status.replace(/_/g, " ")}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{r.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {data && data.error && <p className="text-sm text-rose-400">{data.error}</p>}
    </div>
  );
}