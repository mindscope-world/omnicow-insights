import { Phone, MapPin, ClipboardCheck } from "lucide-react";
import type { Farmer } from "@/lib/omnicow/data";
import { scoreColorVar, pct } from "@/lib/omnicow/data";
import { Button } from "@/components/ui/button";
import { PriorityBadge, ShapCard } from "./primitives";
import { CommunitySignal } from "./community-signal";

function ScoreCell({ label, value }: { label: string; value: number }) {
  const color = scoreColorVar(value);
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color }}>
        {pct(value)}
      </p>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: pct(value), backgroundColor: color }} />
      </div>
    </div>
  );
}

export function DetailPanel({
  farmer,
  onLogOutcome,
}: {
  farmer: Farmer | null;
  onLogOutcome: () => void;
}) {
  if (!farmer) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-text-soft">
        Select a farmer from the queue to see scores, the SHAP explanation, and community signal.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="relative overflow-hidden bg-savanna p-4 text-milk">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent/25 text-base font-bold text-accent">
              {farmer.id.slice(-2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{farmer.id}</p>
              <p className="text-xs text-milk/70">{farmer.ward} ward · Cluster {farmer.cluster}</p>
            </div>
            <PriorityBadge priority={farmer.priority} />
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            <ScoreCell label="Day 7" value={farmer.day7} />
            <ScoreCell label="Day 90" value={farmer.day90} />
            <ScoreCell label="Day 120" value={farmer.day120} />
          </div>

          <ShapCard label="Why this farmer" text={farmer.shap} />

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm">
              <Phone className="size-4" /> Call
            </Button>
            <Button variant="outline" size="sm">
              <MapPin className="size-4" /> Visit
            </Button>
            <Button size="sm" onClick={onLogOutcome}>
              <ClipboardCheck className="size-4" /> Log
            </Button>
          </div>
        </div>
      </div>

      <CommunitySignal farmer={farmer} />
    </div>
  );
}
