import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteLeaflet } from "@/components/omnicow/route-leaflet";
import { PriorityDot } from "@/components/omnicow/primitives";
import { cn } from "@/lib/utils";
import { farmerApi } from "@/lib/api/farmers";
import { useQuery } from "@tanstack/react-query";
import type { Farmer } from "@/lib/omnicow/data";
import { toast } from "sonner";

export const Route = createFileRoute("/route-map")({
  head: () => ({
    meta: [
      { title: "Route Map — OmniCow" },
      { name: "description", content: "Optimised geographic visit order for today's priority queue." },
    ],
  }),
  component: RouteMap,
});

function RouteMap() {
  const { data: farmers = [], isLoading, error } = useQuery({
    queryKey: ['farmers'],
    queryFn: () => farmerApi.getFarmers(0, 1000), // get all farmers
  });

  if (isLoading) return <div className="p-4">Loading farmers...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading farmers</div>;

  const stops = useMemo(
    () =>
      [...farmers]
        .filter((f) => f.priority !== "low")
        .sort((a, b) => b.day7 - a.day7)
        .slice(0, 8),
    [farmers]
  );
  const [nextStop, setNextStop] = useState<Farmer | null>(null);

  const totalKm = (stops.length * 3.4).toFixed(1);
  const totalMin = stops.length * 22;

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative">
        <RouteLeaflet stops={stops} onSelect={(f) => { setNextStop(f); toast.success(`${f.id} set as next stop`); }} />
      </div>

      <aside className="border-l border-border bg-card p-4">
        <h1 className="font-serif text-2xl text-text-strong">Today's route</h1>
        <p className="text-sm text-text-mid">Githunguri sub-county · {stops.length} stops</p>

        <div className="my-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-soft">Total distance</p>
            <p className="text-xl font-bold text-text-strong">{totalKm} km</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-text-soft">Est. time</p>
            <p className="text-xl font-bold text-text-strong">{Math.floor(totalMin / 60)}h {totalMin % 60}m</p>
          </div>
        </div>

        <ol className="space-y-2">
          {stops.map((f, i) => (
            <li
              key={f.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5",
                nextStop?.id === f.id ? "border-savanna bg-savanna/5" : "border-border",
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-savanna text-xs font-bold text-milk">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <PriorityDot priority={f.priority} />
                  <p className="truncate text-sm font-semibold text-text-strong">{f.id}</p>
                </div>
                <p className="truncate text-xs text-text-soft">{f.ward} ward</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-text-soft">
                <Clock className="size-3" /> {12 + i * 2}m
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-4 space-y-2">
          <Button className="w-full" onClick={() => toast.success("Stop list copied for WhatsApp")}>
            <MessageCircle className="size-4" /> Export to WhatsApp
          </Button>
          <Button variant="outline" className="w-full" onClick={() => toast.success("Route recalculated")}>
            <RefreshCw className="size-4" /> Recalculate
          </Button>
        </div>
        {nextStop && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-savanna">
            <MapPin className="size-3.5" /> Next stop: {nextStop.id}
          </p>
        )}
      </aside>
    </div>
  );
}