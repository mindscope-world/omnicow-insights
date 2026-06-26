import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, MapPin, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/omnicow/page-header";
import { ScoreBar } from "@/components/omnicow/primitives";
import { cn } from "@/lib/utils";
import { FARMERS, type WindowKind } from "@/lib/omnicow/data";
import { toast } from "sonner";

export const Route = createFileRoute("/follow-up")({
  head: () => ({
    meta: [
      { title: "Follow-up Schedule — OmniCow" },
      { name: "description", content: "Farmers due for contact on their 7, 90 and 120-day adoption windows." },
    ],
  }),
  component: FollowUp,
});

const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 5, 26 + i);
  return d;
});

function windowBadge(kind: WindowKind) {
  const map: Record<WindowKind, string> = {
    "Day 7": "bg-urgent/10 text-urgent",
    "Day 90": "bg-watch/10 text-watch",
    "Day 120": "bg-safe/10 text-safe",
  };
  return map[kind];
}

function FollowUp() {
  // assign each farmer to a day deterministically
  const byDay = useMemo(() => {
    const map = new Map<number, typeof FARMERS>();
    FARMERS.forEach((f, i) => {
      const day = i % 14;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(f);
    });
    return map;
  }, []);

  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const visibleDays = activeDay === null ? [...byDay.keys()].sort((a, b) => a - b) : [activeDay];

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Follow-up schedule"
        subtitle="Farmers due on their Day 7, 90 and 120 adoption windows across the next two weeks."
      />

      {/* calendar strip */}
      <div className="grid grid-cols-7 gap-2 lg:grid-cols-14">
        {DAYS.map((d, i) => {
          const count = byDay.get(i)?.length ?? 0;
          const urgent = count >= 5;
          const active = activeDay === i;
          return (
            <button
              key={i}
              onClick={() => setActiveDay(active ? null : i)}
              className={cn(
                "rounded-lg border p-2 text-center transition-colors",
                active
                  ? "border-savanna bg-savanna text-milk"
                  : urgent
                    ? "border-urgent/30 bg-urgent/10 text-urgent hover:bg-urgent/15"
                    : "border-border bg-card text-text-mid hover:bg-secondary",
              )}
            >
              <p className="text-[10px] uppercase">{d.toLocaleDateString("en-GB", { weekday: "short" })}</p>
              <p className="text-lg font-bold">{d.getDate()}</p>
              <p className="text-[11px] font-semibold">{count} due</p>
            </button>
          );
        })}
      </div>

      {/* bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-savanna/30 bg-savanna px-4 py-3 text-milk shadow-md">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              toast.success(`${selected.size} farmers marked as contacted`);
              setSelected(new Set());
            }}
          >
            <Check className="size-4" /> Mark as contacted
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toast.success("Selected farmers exported")}>
            Export selected
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary">
                <Users className="size-4" /> Reassign to agent
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["John Mwangi", "Aisha Wanjiru", "Peter Otieno"].map((a) => (
                <DropdownMenuItem key={a} onClick={() => { toast.success(`Reassigned to ${a}`); setSelected(new Set()); }}>
                  {a}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="space-y-6">
        {visibleDays.map((dayIdx) => {
          const farmers = byDay.get(dayIdx) ?? [];
          if (farmers.length === 0) return null;
          return (
            <div key={dayIdx}>
              <h2 className="mb-3 font-serif text-xl text-text-strong">{fmt(DAYS[dayIdx])}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {farmers.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "rounded-xl border bg-card p-4 shadow-sm",
                      selected.has(f.id) ? "border-savanna" : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggle(f.id)} className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-text-strong">{f.id}</p>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", windowBadge(f.window.kind))}>
                            {f.window.kind}
                          </span>
                        </div>
                        <p className="text-xs text-text-soft">{f.ward} ward · Cluster {f.cluster}</p>
                        <div className="mt-2 max-w-40">
                          <ScoreBar value={f.window.kind === "Day 90" ? f.day90 : f.window.kind === "Day 120" ? f.day120 : f.day7} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-text-mid">{f.shap}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm"><Phone className="size-3.5" /> Call</Button>
                          <Button variant="outline" size="sm"><MapPin className="size-3.5" /> Visit</Button>
                          <Button variant="outline" size="sm" onClick={() => toast.success(`${f.id} marked done`)}>
                            <Check className="size-3.5" /> Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
