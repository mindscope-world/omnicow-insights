import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Farmer } from "@/lib/omnicow/data";

export function OutcomeModal({
  farmer,
  open,
  onOpenChange,
}: {
  farmer: Farmer | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [method, setMethod] = useState("visit");
  const [outcome, setOutcome] = useState("adopted");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Log outcome</DialogTitle>
          <DialogDescription>
            {farmer ? `${farmer.id} · ${farmer.ward} ward` : "Record the result of this contact."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Contact method">
            <RadioGroup value={method} onValueChange={setMethod} className="flex gap-4">
              {[
                ["visit", "Visit"],
                ["phone", "Phone call"],
                ["whatsapp", "WhatsApp"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={v} /> {l}
                </label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Outcome">
            <RadioGroup value={outcome} onValueChange={setOutcome} className="grid grid-cols-2 gap-2">
              {[
                ["adopted", "Adopted"],
                ["not_yet", "Not yet"],
                ["refused", "Refused"],
                ["unreachable", "Unreachable"],
              ].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={v} /> {l}
                </label>
              ))}
            </RadioGroup>
          </Field>
          <Field label="Notes (optional)">
            <Textarea placeholder="Anything worth remembering for the next visit…" />
          </Field>
          <Field label="Next follow-up date">
            <Input type="date" defaultValue="2024-07-15" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Outcome logged", {
                description: farmer ? `${farmer.id} marked as ${outcome.replace("_", " ")}.` : undefined,
              });
              onOpenChange(false);
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReScoreModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Re-score queue</DialogTitle>
          <DialogDescription>
            This will recompute adoption probabilities using the latest graph data. Estimated time:
            2–4 minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Re-scoring started", {
                description: "Adoption probabilities are being recomputed.",
              });
              onOpenChange(false);
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-text-mid">{label}</Label>
      {children}
    </div>
  );
}
