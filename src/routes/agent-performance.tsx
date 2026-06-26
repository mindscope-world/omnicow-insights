import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/omnicow/page-header";
import { KpiCard } from "@/components/omnicow/primitives";
import { AgentTable } from "./trends";
import { AGENTS } from "@/lib/omnicow/data";

export const Route = createFileRoute("/agent-performance")({
  head: () => ({
    meta: [
      { title: "Agent Performance — OmniCow" },
      { name: "description", content: "Coverage and adoption outcomes by extension agent." },
    ],
  }),
  component: AgentPerformance,
});

function AgentPerformance() {
  const totalFarmers = AGENTS.reduce((s, a) => s + a.farmers, 0);
  const totalAdoptions = AGENTS.reduce((s, a) => s + a.adoptions, 0);
  const avgDay90 = Math.round(AGENTS.reduce((s, a) => s + a.day90, 0) / AGENTS.length);
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Agent performance" subtitle="This month · Githunguri sub-county" />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Farmers covered" value={totalFarmers} support="across all agents" />
        <KpiCard label="Avg Day 90 rate" value={`${avgDay90}%`} delta={{ value: "3.1% vs last month", up: true }} />
        <KpiCard accentTop label="Adoptions logged" value={totalAdoptions} support="this month" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <AgentTable />
      </div>
    </div>
  );
}
