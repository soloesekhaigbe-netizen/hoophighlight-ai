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
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="label-xs text-flame">Admin</p>
      <h1 className="mt-2 display-xl text-4xl sm:text-6xl">System<br />health.</h1>
      <p className="mt-5 max-w-2xl text-paper/65">
        Real probes of each subsystem. No component is shown as WORKING unless the operation actually succeeded.
      </p>

      <Button onClick={run} disabled={busy} className="mt-8 rounded-none bg-sun text-ink hover:bg-sun-deep">
        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing…</> : <><Activity className="mr-2 h-4 w-4" /> Run full system test</>}
      </Button>

      {data && data.summary && (
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 label-xs">
          <span className="text-sage">{data.summary.working} working</span>
          <span className="text-flame">{data.summary.not_working} not working</span>
          <span className="text-paper/40">{data.summary.not_tested} not tested</span>
        </div>
      )}

      <div className="mt-8 grid gap-px bg-white/10">
        {COMPONENTS.map(([key, label]) => {
          const r = item(key);
          const Icon = r.status === "WORKING" ? CheckCircle2 : r.status === "NOT_WORKING" ? XCircle : MinusCircle;
          const tone = r.status === "WORKING" ? "text-sage" : r.status === "NOT_WORKING" ? "text-flame" : "text-paper/40";
          return (
            <div key={key} className="flex items-center justify-between bg-ink-soft p-5">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${tone}`} />
                <p className="font-heading text-sm font-semibold text-paper">{label}</p>
              </div>
              <div className="max-w-md text-right">
                <p className={`label-xs ${tone}`}>{r.status.replace(/_/g, " ")}</p>
                <p className="mt-1 text-xs text-paper/50">{r.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {data && data.error && <p className="mt-6 text-sm text-flame">{data.error}</p>}
    </div>
  );
}