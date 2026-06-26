import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/omnicow/page-header";
import { StatBar } from "@/components/omnicow/primitives";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLUSTER_COLORS } from "@/lib/omnicow/data";
import { farmerApi } from "@/lib/api/farmers";
import { useQuery } from "@tanstack/react-query";
import type { Farmer } from "@/lib/omnicow/data";

export const Route = createFileRoute("/clusters")({
  head: () => ({
    meta: [
      { title: "Neo4j Clusters — OmniCow" },
      { name: "description", content: "Louvain community clusters detected in the farmer graph." },
    ],
  }),
  component: Clusters,
});

function Clusters() {
  const { data: farmers = [], isLoading, error } = useQuery({
    queryKey: ['farmers'],
    queryFn: () => farmerApi.getFarmers(0, 1000), // get all farmers
  });

  if (isLoading) return <div className="p-4">Loading clusters...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading clusters</div>;

  // Compute clusters from farmers data
  const clusterSet = new Set<number>();
  farmers.forEach(f => clusterSet.add(f.cluster));
  const clusters = Array.from(clusterSet).sort((a, b) => a - b);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Neo4j clusters" subtitle="Louvain communities detected in the farmer relationship graph." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clusters.map((c) => {
          const fs = farmers.filter((f) => f.cluster === c);
          const peer = fs.reduce((s, f) => s + f.peerAdoptionRatio, 0) / fs.length;
          const adopters = fs.filter((f) => f.adopted).length;
          const rising = fs.filter((f) => f.momentum === "rising").length >= fs.length / 2;
          return (
            <div key={c} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="size-4 rounded-full" style={{ background: CLUSTER_COLORS[c % CLUSTER_COLORS.length] }} />
                <h3 className="font-bold text-text-strong">Cluster {c}</h3>
                <span
                  className={cn("ml-auto inline-flex items-center gap-1 text-xs font-semibold", rising ? "text-safe" : "text-urgent")}
                >
                  {rising ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {rising ? "Rising" : "Falling"}
                </span>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-text-soft">Members</dt><dd className="font-semibold">{fs.length}</dd></div>
                <div className="flex justify-between"><dt className="text-text-soft">Adopters</dt><dd className="font-semibold text-safe">{adopters}</dd></div>
                <div>
                  <div className="mb-1 flex justify-between"><dt className="text-text-soft">Avg peer adoption</dt><dd className="font-semibold">{Math.round(peer * 100)}%</dd></div>
                  <StatBar value={peer} color={CLUSTER_COLORS[c % CLUSTER_COLORS.length]} />
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}