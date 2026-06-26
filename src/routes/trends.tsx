import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/omnicow/page-header";
import { cn } from "@/lib/utils";
import { trendSeries, AGENTS, CLUSTERS, FARMERS } from "@/lib/omnicow/data";
import { toast } from "sonner";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Adoption Trends — OmniCow" },
      { name: "description", content: "How farmer adoption is moving across the sub-county over time." },
    ],
  }),
  component: Trends,
});

const RANGES = [
  ["3", "3 months"],
  ["6", "6 months"],
  ["12", "12 months"],
  ["all", "All time"],
] as const;

function barColor(rate: number) {
  return rate >= 60 ? "var(--safe)" : rate >= 30 ? "var(--watch)" : "var(--urgent)";
}

function Trends() {
  const [range, setRange] = useState("12");
  const all = trendSeries();
  const data = range === "all" ? all : all.slice(-parseInt(range));

  const byCluster = CLUSTERS.map((c) => {
    const fs = FARMERS.filter((f) => f.cluster === c);
    const rate = Math.round((fs.reduce((s, f) => s + f.day90, 0) / fs.length) * 100);
    return { label: `Cluster ${c}`, rate };
  });
  const byTopic = ["Milk hygiene", "Feed rationing", "Calf rearing", "Record keeping", "Mastitis control"]
    .map((t, i) => ({ label: t, rate: 72 - i * 9 }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Adoption trends"
        subtitle="Githunguri sub-county · monthly adoption rates by window"
        actions={
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {RANGES.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setRange(k)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  range === k ? "bg-savanna text-milk" : "text-text-mid hover:bg-secondary",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-text-strong">Adoption rate over time</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-soft)" fontSize={12} />
              <YAxis domain={[0, 100]} unit="%" stroke="var(--text-soft)" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                formatter={(v: number, n) => [`${Math.round(v)}%`, n]}
              />
              <Legend />
              <Line type="monotone" dataKey="day7" name="Day 7" stroke="var(--safe)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="day90" name="Day 90" stroke="var(--accent)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="day120" name="Day 120" stroke="var(--savanna)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownPanel title="By community cluster" rows={byCluster} />
        <BreakdownPanel title="By training topic" rows={byTopic} />
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-text-strong">By registration method</h3>
          <div className="space-y-3">
            {[
              ["mobile_app", 78, 64, 52],
              ["cooperative", 62, 50, 41],
              ["field_agent", 54, 43, 35],
              ["ussd", 41, 32, 26],
            ].map(([name, d7, d90, d120]) => (
              <div key={name as string}>
                <p className="mb-1 text-xs font-medium capitalize text-text-mid">{(name as string).replace("_", " ")}</p>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div style={{ width: `${d7}%`, background: "var(--safe)" }} />
                  <div style={{ width: `${(d90 as number) - 30}%`, background: "var(--accent)" }} />
                  <div style={{ width: `${(d120 as number) - 25}%`, background: "var(--savanna)" }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-text-soft">Mobile app registrants adopt fastest across all windows.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-text-strong">Agent performance</h2>
          <Button variant="outline" size="sm" onClick={() => toast.success("Report exported")}>
            <Download className="size-4" /> Export
          </Button>
        </div>
        <AgentTable />
      </div>
    </div>
  );
}

function BreakdownPanel({ title, rows }: { title: string; rows: { label: string; rate: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-text-strong">{title}</h3>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-text-mid">{r.label}</span>
              <span className="font-semibold" style={{ color: barColor(r.rate) }}>{r.rate}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${r.rate}%`, background: barColor(r.rate) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-text-soft">
            <th className="py-2 pr-3 font-semibold">Agent</th>
            <th className="py-2 px-3 font-semibold">Farmers covered</th>
            <th className="py-2 px-3 font-semibold">Avg Day 7</th>
            <th className="py-2 px-3 font-semibold">Avg Day 90</th>
            <th className="py-2 px-3 font-semibold">Adoptions logged</th>
          </tr>
        </thead>
        <tbody>
          {AGENTS.map((a) => (
            <tr key={a.name} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3 font-semibold text-text-strong">{a.name}</td>
              <td className="py-2.5 px-3 text-text-mid">{a.farmers}</td>
              <td className="py-2.5 px-3 text-text-mid">{a.day7}%</td>
              <td className="py-2.5 px-3 text-text-mid">{a.day90}%</td>
              <td className="py-2.5 px-3 font-semibold text-safe">{a.adoptions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
