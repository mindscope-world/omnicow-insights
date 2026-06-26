import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ForceGraph, type GraphFilters } from "@/components/omnicow/force-graph";
import { ShapCard, StatBar } from "@/components/omnicow/primitives";
import { cn } from "@/lib/utils";
import { CLUSTERS, CLUSTER_COLORS, FARMERS, type Farmer } from "@/lib/omnicow/data";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Graph — OmniCow" },
      { name: "description", content: "Force-directed visualisation of the Neo4j Louvain community output." },
    ],
  }),
  component: Community,
});

function Community() {
  const [filters, setFilters] = useState<GraphFilters>({
    visibleClusters: new Set(CLUSTERS),
    edgeMode: "both",
    adoptedOnly: false,
  });
  const [selected, setSelected] = useState<Farmer | null>(FARMERS[0]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const toggleCluster = (c: number) =>
    setFilters((f) => {
      const next = new Set(f.visibleClusters);
      next.has(c) ? next.delete(c) : next.add(c);
      return { ...f, visibleClusters: next };
    });

  return (
    <div className="grid lg:grid-cols-[1fr_360px]">
      <div ref={wrapRef} className="relative h-[calc(100vh-4rem)] bg-milk">
        <ForceGraph farmers={FARMERS} filters={filters} onSelect={setSelected} />
        <div className="absolute left-4 top-4 flex flex-col gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
          {[ZoomIn, ZoomOut, Maximize].map((Icon, i) => (
            <button
              key={i}
              onClick={() => {
                const svg = wrapRef.current?.querySelector("svg") as any;
                if (i === 2 && svg?.__reset) svg.__reset();
              }}
              className="grid size-8 place-items-center rounded hover:bg-secondary"
            >
              <Icon className="size-4 text-text-mid" />
            </button>
          ))}
        </div>
      </div>

      <aside className="space-y-5 border-l border-border bg-card p-4">
        <div>
          <h2 className="font-serif text-xl text-text-strong">Community graph</h2>
          <p className="text-xs text-text-soft">Node size = PageRank · colour = Louvain cluster</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-strong">Communities</h3>
          <div className="space-y-1">
            {CLUSTERS.map((c) => (
              <button
                key={c}
                onClick={() => toggleCluster(c)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary",
                  !filters.visibleClusters.has(c) && "opacity-40",
                )}
              >
                <span className="size-3 rounded-full" style={{ background: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
                Cluster {c}
                <span className="ml-auto text-xs text-text-soft">
                  {FARMERS.filter((f) => f.cluster === c).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-strong">Edges</h3>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {(["both", "ward", "trainer"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilters((f) => ({ ...f, edgeMode: m }))}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize",
                  filters.edgeMode === m ? "bg-savanna text-milk" : "text-text-mid hover:bg-secondary",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="adopted" className="text-sm text-text-mid">Show only adopted farmers</Label>
          <Switch
            id="adopted"
            checked={filters.adoptedOnly}
            onCheckedChange={(v) => setFilters((f) => ({ ...f, adoptedOnly: v }))}
          />
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="font-bold text-text-strong">{selected.id}</h3>
            <p className="text-xs text-text-soft">{selected.ward} ward · Cluster {selected.cluster}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-soft">PageRank</dt><dd className="font-semibold">{selected.pageRank.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-soft">Adopted</dt><dd className={cn("font-semibold", selected.adopted ? "text-safe" : "text-urgent")}>{selected.adopted ? "Yes" : "No"}</dd></div>
              <div>
                <div className="mb-1 flex justify-between"><dt className="text-text-soft">Peer adoption</dt><dd className="font-semibold">{Math.round(selected.peerAdoptionRatio * 100)}%</dd></div>
                <StatBar value={selected.peerAdoptionRatio} color="var(--accent)" />
              </div>
            </dl>
            <div className="mt-3">
              <ShapCard text={selected.shap} />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
