import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/omnicow/page-header";
import { KpiCard } from "@/components/omnicow/primitives";
import { AgentTable } from "./trends";
import { useQuery } from "@tanstack/react-query";
import { agentApi } from "@/lib/api/agent";

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
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.getAgentPerformance(),
  });

  if (isLoading) return <div className="p-4">Loading agent performance...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading agent data</div>;

  const totalFarmers = agents.reduce((s, a) => s + (a.unique_attendees || 0), 0);
  const totalAdoptions = agents.reduce((s, a) => s + (a.total_attendees || 0), 0); // Using total_attendees as proxy for adoptions
  const avgDay90 = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + (a.average_attendance_per_training || 0), 0) / agents.length)
    : 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Agent performance" subtitle="This month · Githunguri sub-county" />
      <div className="gap-4 sm:grid-cols-3">
        <KpiCard label="Farmers covered" value={totalFarmers} support="across all agents" />
        <KpiCard label="Avg Day 90 rate" value={`${avgDay90}%`} delta={{ value: "3.1% vs last month", up: true }} />
        <KpiCard accentTop label="Adoptions logged" value={totalAdoptions} support="this month" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <AgentTable agents={agents} />
      </div>
    </div>
  );
}