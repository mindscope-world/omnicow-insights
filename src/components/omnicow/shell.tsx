import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  CalendarClock,
  Map,
  Users,
  TrendingUp,
  Share2,
  Gauge,
  Boxes,
  Settings,
  LifeBuoy,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TopoTexture } from "./primitives";
import { SyncPill } from "./sync-pill";
import { useOfflineStore } from "@/lib/omnicow/store";
import { SYNC_TIMESTAMP, priorityCounts } from "@/lib/omnicow/data";

const NAV = [
  {
    label: "Workspace",
    items: [
      { to: "/", icon: LayoutGrid, name: "Priority Queue", badge: "urgent" as const },
      { to: "/follow-up", icon: CalendarClock, name: "Follow-up Schedule", badge: "window" as const },
      { to: "/route-map", icon: Map, name: "Route Map" },
      { to: "/farmers", icon: Users, name: "Farmer Profiles" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/trends", icon: TrendingUp, name: "Adoption Trends" },
      { to: "/community", icon: Share2, name: "Community Graph" },
      { to: "/agent-performance", icon: Gauge, name: "Agent Performance" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/clusters", icon: Boxes, name: "Neo4j Clusters" },
      { to: "/settings", icon: Settings, name: "Settings" },
    ],
  },
];

function Topbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 bg-savanna text-milk">
      <TopoTexture className="text-milk opacity-15" />
      <div className="relative flex h-full items-center gap-4 px-4 md:px-6">
        <div className="flex w-[204px] shrink-0 flex-col justify-center">
          <span className="font-serif text-2xl leading-none">
            <span className="text-milk">Omni</span>
            <span className="text-accent">Cow</span>
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-milk/60">
            Extension Intelligence Platform · DigiCow Africa
          </span>
        </div>
        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-milk/50" />
          <input
            placeholder="Search farmers, wards, clusters…"
            className="h-9 w-full max-w-md rounded-full border border-milk/15 bg-milk/10 pl-9 pr-4 text-sm text-milk placeholder:text-milk/50 outline-none focus:border-accent/60"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SyncPill />
          <button className="relative grid size-9 place-items-center rounded-full bg-milk/10 text-milk hover:bg-milk/20">
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
          </button>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              KM
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-milk">Kazi Mwende</p>
              <p className="text-[11px] text-milk/60">Githunguri sub-county</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const counts = priorityCounts();
  return (
    <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[220px] flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-soft">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-savanna text-milk"
                          : "text-text-mid hover:bg-secondary",
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-text-soft")} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge === "urgent" && (
                        <span className="rounded-full bg-urgent px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {counts.urgent}
                        </span>
                      )}
                      {item.badge === "window" && (
                        <span className="rounded-full bg-watch/15 px-1.5 py-0.5 text-[10px] font-bold text-watch">
                          12
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <a
          href="mailto:support@digicow.africa"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-mid hover:bg-secondary"
        >
          <LifeBuoy className="size-4 text-text-soft" />
          Support
        </a>
      </div>
    </aside>
  );
}

function OfflineBanner() {
  const offline = useOfflineStore((s) => s.offline);
  if (!offline) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-watch/15 px-4 py-2 text-center text-sm font-medium text-watch">
      <span className="size-2 rounded-full bg-watch" />
      Offline — showing data from {SYNC_TIMESTAMP}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <Sidebar />
      <div className="pt-16 md:pl-[220px]">
        <OfflineBanner />
        <main>{children}</main>
      </div>
    </div>
  );
}
