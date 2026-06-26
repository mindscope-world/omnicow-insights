import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Check, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/omnicow/page-header";
import { ShapCard, StatBar } from "@/components/omnicow/primitives";
import { cn } from "@/lib/utils";
import { FARMERS, type Farmer, type Outcome } from "@/lib/omnicow/data";

export const Route = createFileRoute("/farmers")({
  head: () => ({
    meta: [
      { title: "Farmer Profiles — OmniCow" },
      { name: "description", content: "Full farmer records, adoption history and graph features." },
    ],
  }),
  component: FarmerProfiles,
});

function FarmerProfiles() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(FARMERS[0].id);

  const filtered = useMemo(
    () =>
      FARMERS.filter(
        (f) =>
          f.id.toLowerCase().includes(query.toLowerCase()) ||
          f.ward.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 25),
    [query],
  );
  const farmer = FARMERS.find((f) => f.id === selectedId)!;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Farmer profiles" subtitle="Search any farmer and review their full intervention record." />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-soft" />
            <Input
              placeholder="Farmer ID or ward…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[70vh] space-y-1.5 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left transition-colors",
                  f.id === selectedId ? "bg-savanna text-milk" : "hover:bg-secondary",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{f.id}</span>
                  {f.cooperative !== "Independent" && (
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px]", f.id === selectedId ? "bg-milk/20" : "bg-secondary text-text-soft")}>
                      Co-op
                    </span>
                  )}
                </div>
                <p className={cn("text-xs", f.id === selectedId ? "text-milk/70" : "text-text-soft")}>
                  {f.ward} · last contact {f.lastContact}
                </p>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-text-soft">Showing {filtered.length} · 25 per page</p>
        </div>

        <FarmerDetail farmer={farmer} />
      </div>
    </div>
  );
}

const OUTCOME_ICON: Record<Outcome, React.ReactNode> = {
  adopted: <Check className="size-4 text-safe" />,
  not_adopted: <X className="size-4 text-urgent" />,
  pending: <Clock className="size-4 text-watch" />,
};

function FarmerDetail({ farmer }: { farmer: Farmer }) {
  const adopters = Math.round(farmer.peerAdoptionRatio * farmer.communitySize);
  const donut = [
    { name: "Adopters", value: adopters, color: "var(--safe)" },
    { name: "Non-adopters", value: farmer.communitySize - adopters, color: "var(--border)" },
  ];
  const peers = FARMERS.filter((f) => f.ward === farmer.ward && f.id !== farmer.id).slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="relative overflow-hidden border-b border-border bg-savanna p-5 text-milk">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-xl bg-accent/25 text-xl font-bold text-accent">
            {farmer.id.slice(-2)}
          </span>
          <div>
            <h2 className="font-serif text-2xl">{farmer.id}</h2>
            <p className="text-sm text-milk/70">{farmer.ward} ward · {farmer.subCounty}, {farmer.county}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="p-5">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="adoption">Adoption history</TabsTrigger>
          <TabsTrigger value="graph">Graph features</TabsTrigger>
          <TabsTrigger value="shap">SHAP breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Gender", farmer.gender],
              ["Age", `${farmer.age} (${farmer.ageGroup})`],
              ["Registration", farmer.registration.replace("_", " ")],
              ["Cooperative", farmer.cooperative],
              ["County", farmer.county],
              ["Sub-county", farmer.subCounty],
              ["Ward", farmer.ward],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-text-soft">{k}</dt>
                <dd className="font-semibold capitalize text-text-strong">{v}</dd>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-text-strong">Training history</h3>
            <p className="text-sm text-text-mid">First training: {farmer.firstTraining} · Trainer: {farmer.trainers.join(", ")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {farmer.topics.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="adoption">
          <ol className="relative space-y-4 border-l-2 border-border pl-5">
            {farmer.history.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 grid size-5 place-items-center rounded-full bg-card ring-2 ring-border">
                  {OUTCOME_ICON[h.day120]}
                </span>
                <p className="font-semibold text-text-strong">{h.topic}</p>
                <p className="text-xs text-text-soft">Intervention started {h.date}</p>
                <div className="mt-1.5 flex gap-4 text-xs">
                  {(["day7", "day90", "day120"] as const).map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 text-text-mid">
                      {k.replace("day", "Day ")} {OUTCOME_ICON[h[k]]}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="graph" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-soft">Louvain community</p>
                <p className="text-lg font-bold text-text-strong">#{farmer.cluster} · {farmer.communitySize} farmers</p>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-text-soft">PageRank score</span>
                  <span className="font-semibold text-text-strong">{farmer.pageRank.toFixed(2)}</span>
                </div>
                <Gauge value={farmer.pageRank} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-text-soft">Influence score</span>
                  <span className="font-semibold text-text-strong">{Math.round(farmer.influence * 100)}%</span>
                </div>
                <StatBar value={farmer.influence} color="var(--accent)" />
              </div>
            </div>
            <div className="text-center">
              <p className="mb-2 text-sm text-text-soft">Peer adoption — {farmer.ward} ward</p>
              <div className="mx-auto h-40 w-40">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={2}>
                      {donut.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm font-semibold text-text-strong">{Math.round(farmer.peerAdoptionRatio * 100)}% adopters</p>
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-text-strong">Ward peer list</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-text-soft">
                  <th className="py-2 font-semibold">Farmer</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Community</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 font-medium text-text-strong">{p.id}</td>
                    <td className="py-2">
                      <span className={cn("text-xs font-semibold", p.adopted ? "text-safe" : "text-urgent")}>
                        {p.adopted ? "Adopted" : "Not adopted"}
                      </span>
                    </td>
                    <td className="py-2 text-text-soft">#{p.cluster}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="shap" className="space-y-4">
          <h3 className="font-semibold text-text-strong">SHAP feature contributions — latest prediction</h3>
          <div className="space-y-2">
            {farmer.shapFeatures.map((s) => {
              const max = 40;
              const w = Math.min(100, (Math.abs(s.impact) / max) * 100);
              const pos = s.impact >= 0;
              return (
                <div key={s.feature} className="grid grid-cols-[160px_1fr_48px] items-center gap-2 text-sm">
                  <span className="truncate text-text-mid">{s.feature}</span>
                  <div className="flex items-center">
                    <div className="flex w-1/2 justify-end">
                      {!pos && <div className="h-3 rounded-l bg-urgent" style={{ width: `${w}%` }} />}
                    </div>
                    <div className="flex w-1/2">
                      {pos && <div className="h-3 rounded-r bg-safe" style={{ width: `${w}%` }} />}
                    </div>
                  </div>
                  <span className={cn("text-right font-semibold tabular-nums", pos ? "text-safe" : "text-urgent")}>
                    {pos ? "+" : ""}{s.impact}
                  </span>
                </div>
              );
            })}
          </div>
          <ShapCard label="Plain-language summary" text={farmer.shap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 40;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 100 56" className="w-32">
      <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="var(--savanna)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
      />
      <text x="50" y="48" textAnchor="middle" className="fill-text-strong text-[16px] font-bold">
        {value.toFixed(2)}
      </text>
    </svg>
  );
}
