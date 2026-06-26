import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Priority } from "@/lib/omnicow/data";
import { scoreColorVar, pct } from "@/lib/omnicow/data";

/* ── TopoHeader: savanna surface with contour-line texture ───────────── */
export function TopoTexture({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      preserveAspectRatio="none"
      viewBox="0 0 800 240"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => (
          <path
            key={i}
            d={`M0 ${30 + i * 22} C 150 ${10 + i * 22}, 300 ${60 + i * 20}, 450 ${30 + i * 22} S 750 ${10 + i * 22}, 800 ${40 + i * 21}`}
          />
        ))}
      </g>
    </svg>
  );
}

export function TopoHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-savanna text-milk", className)}>
      <TopoTexture className="text-milk opacity-15" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── PriorityBadge ───────────────────────────────────────────────────── */
const PRIORITY_META: Record<Priority, { label: string; dot: string; text: string; bg: string }> = {
  urgent: { label: "Urgent", dot: "bg-urgent", text: "text-urgent", bg: "bg-urgent/10" },
  watch: { label: "Watch", dot: "bg-watch", text: "text-watch", bg: "bg-watch/10" },
  low: { label: "Low", dot: "bg-safe", text: "text-safe", bg: "bg-safe/10" },
};

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full", PRIORITY_META[priority].dot, className)} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", m.bg, m.text)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

/* ── ScoreBar ────────────────────────────────────────────────────────── */
export function ScoreBar({
  value,
  showLabel = true,
  className,
}: {
  value: number;
  showLabel?: boolean;
  className?: string;
}) {
  const color = scoreColorVar(value);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full min-w-10 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full" style={{ width: pct(value), backgroundColor: color }} />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color }}>
          {pct(value)}
        </span>
      )}
    </div>
  );
}

/* ── ShapCard ────────────────────────────────────────────────────────── */
export function ShapCard({ text, label }: { text: string; label?: string }) {
  return (
    <div className="rounded-r-md border-l-4 border-accent bg-accent/8 px-3 py-2.5">
      {label && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">{label}</p>}
      <p className="text-sm leading-snug text-text-mid">{text}</p>
    </div>
  );
}

/* ── KpiCard ─────────────────────────────────────────────────────────── */
export function KpiCard({
  label,
  value,
  support,
  delta,
  accentTop = false,
  urgent = false,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  support?: string;
  delta?: { value: string; up: boolean };
  accentTop?: boolean;
  urgent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        accentTop && "border-t-4 border-t-accent",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-soft">{label}</p>
        {icon && <span className="text-accent">{icon}</span>}
      </div>
      <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", urgent ? "text-urgent" : "text-text-strong")}>
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", delta.up ? "text-safe" : "text-urgent")}>
            {delta.up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {delta.value}
          </span>
        )}
        {support && <span className="text-text-soft">{support}</span>}
      </div>
    </div>
  );
}

/* ── Inline stat bar ─────────────────────────────────────────────────── */
export function StatBar({ value, color = "var(--savanna)" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full" style={{ width: pct(value), backgroundColor: color }} />
    </div>
  );
}
