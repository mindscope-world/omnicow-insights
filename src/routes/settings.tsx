import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/omnicow/page-header";
import { cn } from "@/lib/utils";
import {
  useOfflineStore, setOffline, setLanguage, setScoreDisplay,
} from "@/lib/omnicow/store";
import { SYNC_TIMESTAMP } from "@/lib/omnicow/data";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OmniCow" },
      { name: "description", content: "Agent profile, data sync and display preferences." },
    ],
  }),
  component: Settings,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-text-strong">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {options.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium", value === k ? "bg-savanna text-milk" : "text-text-mid hover:bg-secondary")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Settings() {
  const offline = useOfflineStore((s) => s.offline);
  const language = useOfflineStore((s) => s.language);
  const scoreDisplay = useOfflineStore((s) => s.scoreDisplay);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <PageHeader title="Settings" />

      <Section title="Agent profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label className="text-text-soft">Name</Label><Input readOnly value="Kazi Mwende" className="mt-1.5" /></div>
          <div><Label className="text-text-soft">Sub-county</Label><Input readOnly value="Githunguri" className="mt-1.5" /></div>
          <div><Label className="text-text-soft">Registered</Label><Input readOnly value="2023-04-11" className="mt-1.5" /></div>
          <div><Label className="text-text-soft">Change password</Label><Input type="password" placeholder="New password" className="mt-1.5" /></div>
        </div>
      </Section>

      <Section title="Data sync">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-strong">Last sync</p>
            <p className="text-xs text-text-soft">{SYNC_TIMESTAMP}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("Sync complete")}>
            <RefreshCw className="size-4" /> Sync now
          </Button>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium text-text-strong">Offline mode</p>
            <p className="text-xs text-text-soft">Serve the last downloaded snapshot</p>
          </div>
          <Switch checked={offline} onCheckedChange={setOffline} />
        </div>
        <p className="text-xs text-text-soft">Farmer data: 2.3 MB stored locally</p>
      </Section>

      <Section title="Display preferences">
        <div>
          <Label className="mb-1.5 block text-text-soft">Language</Label>
          <Toggle value={language} options={[["en", "English"], ["sw", "Swahili"]]} onChange={(v) => setLanguage(v as "en" | "sw")} />
        </div>
        <div>
          <Label className="mb-1.5 block text-text-soft">Score display</Label>
          <Toggle value={scoreDisplay} options={[["percent", "Percentages"], ["band", "Band labels only"]]} onChange={(v) => setScoreDisplay(v as "percent" | "band")} />
        </div>
        <div>
          <Label className="mb-1.5 block text-text-soft">Theme</Label>
          <Toggle
            value={document.documentElement.classList.contains("dark") ? "dark" : "light"}
            options={[["light", "Light"], ["dark", "Dark"]]}
            onChange={(v) => document.documentElement.classList.toggle("dark", v === "dark")}
          />
        </div>
      </Section>
    </div>
  );
}
