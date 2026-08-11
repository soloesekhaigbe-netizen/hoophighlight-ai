import { RefreshCw } from "lucide-react";

/** Shared pull-to-refresh spinner used by the usePullToRefresh hook. */
export default function PullToRefreshIndicator({ pull, refreshing, threshold = 70 }) {
  return (
    <div
      className="pointer-events-none flex items-center justify-center transition-opacity md:hidden"
      style={{ height: pull, opacity: pull / threshold }}
      aria-hidden="true">
      <RefreshCw
        className={`h-6 w-6 text-primary ${refreshing ? "animate-spin" : ""}`}
        style={{ transform: `rotate(${pull * 3}deg)` }}
      />
    </div>
  );
}