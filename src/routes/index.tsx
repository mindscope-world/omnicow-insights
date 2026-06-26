import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, RefreshCw, Route as RouteIcon, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/omnicow/page-header";
import { KpiCard, PriorityBadge, PriorityDot, ScoreBar } from "@/components/omnicow/primitives";
import { DetailPanel } from "@/components/omnicow/detail-panel";
import { OutcomeModal, ReScoreModal } from "@/components/omnicow/modals";
import { cn } from "@/lib/utils";
import {
  FARMERS,
  CLUSTERS,
  priorityCounts,
  type Farmer,
  type Priority,
} from "@/lib/omnicow/data";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Priority Queue — OmniCow" },
      { name: "description", content: "Today's prioritised farmer visit queue ranked by adoption probability." },
    ],
  }),
  component: PriorityQueue,
});

type Filter = "all" | Priority | "day7" | "day90";
type SortKey = "day7" | "day90" | "day120";

function PriorityQueue() {
  const navigate = useNavigate();
  const counts = priorityCounts();
  const [filter, setFilter] = useState<Filter>("all");
  const [cluster, setCluster] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortKey>("day7");
  const [selectedId, setSelectedId] = useState<string>(FARMERS[0].id);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [rescoreOpen, setRescoreOpen] = useState(false);

  const rows = useMemo(() => {
    let list = [...FARMERS];
    if (filter === "urgent" || filter === "watch" || filter === "low")
      list = list.filter((f) => f.priority === filter);
    if (filter === "day7") list = list.filter((f) => f.window.kind === "Day 7");
    if (filter === "day90") list = list.filter((f) => f.window.kind === "Day 90");
    if (cluster !== "all") list = list.filter((f) => f.cluster === cluster);
    list.sort((a, b) => b[sort] - a[sort]);
    return list;
  }, [filter, cluster, sort]);

  const selected = FARMERS.find((f) => f.id === selectedId) ?? null;
  const persuadable = FARMERS.filter((f) => f.day7 >= 0.3 && f.day7 <= 0.85).length;
  const avg = Math.round((FARMERS.reduce((s, f) => s + f.day7, 0) / FARMERS.length) * 100);
  const closing = FARMERS.filter((f) => f.window.daysRemaining <= 2).length;

  const filters: { key: Filter; label: string; dot?: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "urgent", label: `Urgent (${counts.urgent})`, dot: "bg-urgent" },
    { key: "watch", label: `Watch (${counts.watch})`, dot: "bg-watch" },
    { key: "low", label: `Low (${counts.low})`, dot: "bg-safe" },
    { key: "day7", label: "Day 7 window" },
    { key: "day90", label: "Day 90 window" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Priority queue — Friday, 26 Jun"
        subtitle={`Githunguri sub-county · ${counts.all} farmers scheduled · ${counts.urgent} urgent`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Queue exported to CSV")}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRescoreOpen(true)}>
              <RefreshCw className="size-4" /> Re-score
            </Button>
            <Button size="sm" onClick={() => navigate({ to: "/route-map" })}>
              <RouteIcon className="size-4" /> Optimise Route
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard accentTop label="Persuadable today" value={persuadable} support={`of ${counts.all} scheduled farmers`} />
        <KpiCard label="Avg adoption score" value={`${avg}%`} delta={{ value: "4.2% vs last week", up: true }} />
        <KpiCard urgent label="Day 7 windows closing" value={closing} support="expiring within 48h" />
        <KpiCard label="Top cluster momentum" value="1.4×" delta={{ value: "Peer adoption rising", up: true }} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {/* filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "border-savanna bg-savanna text-milk"
                    : "border-border bg-card text-text-mid hover:bg-secondary",
                )}
              >
                {f.dot && <span className={cn("size-1.5 rounded-full", f.dot)} />}
                {f.label}
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-text-mid hover:bg-secondary">
                  {cluster === "all" ? "All clusters" : `Cluster ${cluster}`}
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCluster("all")}>All clusters</DropdownMenuItem>
                {CLUSTERS.map((c) => (
                  <DropdownMenuItem key={c} onClick={() => setCluster(c)}>
                    Cluster {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-soft">
                    <th className="px-4 py-3 font-semibold">Farmer</th>
                    <th className="px-3 py-3 font-semibold">Location</th>
                    <th className="px-3 py-3 font-semibold">Cluster</th>
                    <th className="px-3 py-3 font-semibold">Priority</th>
                    {(["day7", "day90", "day120"] as SortKey[]).map((k) => (
                      <th key={k} className="px-3 py-3 font-semibold">
                        <button
                          onClick={() => setSort(k)}
                          className={cn("inline-flex items-center gap-1", sort === k && "text-savanna")}
                        >
                          {k === "day7" ? "Day 7" : k === "day90" ? "Day 90" : "Day 120"}
                          <ArrowUpDown className="size-3" />
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-3 font-semibold">Window</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <FarmerRow
                      key={f.id}
                      farmer={f}
                      selected={f.id === selectedId}
                      onClick={() => setSelectedId(f.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <DetailPanel farmer={selected} onLogOutcome={() => setOutcomeOpen(true)} />
        </div>
      </div>

      <OutcomeModal farmer={selected} open={outcomeOpen} onOpenChange={setOutcomeOpen} />
      <ReScoreModal open={rescoreOpen} onOpenChange={setRescoreOpen} />
    </div>
  );
}

function FarmerRow({
  farmer,
  selected,
  onClick,
}: {
  farmer: Farmer;
  selected: boolean;
  onClick: () => void;
}) {
  const urgentWindow = farmer.window.daysRemaining <= 2;
  return (
    <tr
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50",
        selected && "bg-savanna/5",
      )}
      style={selected ? { boxShadow: "inset 3px 0 0 var(--savanna)" } : undefined}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <PriorityDot priority={farmer.priority} />
          <span className="font-semibold text-text-strong">{farmer.id}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-text-soft">{farmer.ward}</td>
      <td className="px-3 py-3 text-text-soft">#{farmer.cluster}</td>
      <td className="px-3 py-3">
        <PriorityBadge priority={farmer.priority} />
      </td>
      <td className="w-28 px-3 py-3">
        <ScoreBar value={farmer.day7} />
      </td>
      <td className="w-28 px-3 py-3">
        <ScoreBar value={farmer.day90} />
      </td>
      <td className="w-28 px-3 py-3">
        <ScoreBar value={farmer.day120} />
      </td>
      <td className="px-3 py-3">
        <span className={cn("text-xs font-medium", urgentWindow ? "text-urgent" : "text-text-mid")}>
          {farmer.window.kind} · {farmer.window.daysRemaining}d
        </span>
      </td>
    </tr>
  );
}
