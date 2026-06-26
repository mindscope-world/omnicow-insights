import { TrendingDown, TrendingUp } from "lucide-react";
import type { Farmer } from "@/lib/omnicow/data";
import { StatBar } from "./primitives";

export function CommunitySignal({ farmer }: { farmer: Farmer }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-bold text-text-strong">
        Cluster {farmer.cluster} — community signal
      </h3>
      <dl className="mt-3 space-y-3 text-sm">
        <Row label="Cluster size" value={`${farmer.communitySize} farmers`} />
        <BarRow label="Peer adoption ratio" value={farmer.peerAdoptionRatio} />
        <BarRow label="Influence score" value={farmer.influence} />
        <Row label="Louvain community ID" value={`#${farmer.cluster}`} />
        <div className="flex items-center justify-between">
          <dt className="text-text-soft">Cluster momentum</dt>
          <dd
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: farmer.momentum === "rising" ? "var(--safe)" : "var(--urgent)" }}
          >
            {farmer.momentum === "rising" ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
            {farmer.momentum === "rising" ? "Rising" : "Falling"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-soft">{label}</dt>
      <dd className="font-semibold text-text-strong">{value}</dd>
    </div>
  );
}

function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <dt className="text-text-soft">{label}</dt>
        <dd className="font-semibold text-text-strong">{Math.round(value * 100)}%</dd>
      </div>
      <StatBar value={value} color="var(--accent)" />
    </div>
  );
}
