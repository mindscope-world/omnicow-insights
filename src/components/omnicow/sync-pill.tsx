import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useOfflineStore } from "@/lib/omnicow/store";
import { SYNC_TIMESTAMP } from "@/lib/omnicow/data";

export function SyncPill() {
  const offline = useOfflineStore((s) => s.offline);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  void tick;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        offline ? "border-watch/40 bg-watch/10 text-watch" : "border-safe/30 bg-safe/10 text-safe",
      )}
    >
      <span className={cn("size-2 rounded-full", offline ? "bg-watch animate-pulse" : "bg-safe")} />
      {offline ? "Offline" : "Synced"} · {SYNC_TIMESTAMP}
    </div>
  );
}
