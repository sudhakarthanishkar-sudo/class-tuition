import { Check, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DEFAULT_SUBJECT_COLOUR, SUBJECT_COLOURS } from "@/types";

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { name: string; colour: string }) => void;
  isPending: boolean;
  errorMessage: string | null;
}

/** Modal form for creating a subject with a name and a chosen colour. */
export function AddSubjectDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  errorMessage,
}: AddSubjectDialogProps) {
  const [name, setName] = useState("");
  const [colour, setColour] = useState<string>(DEFAULT_SUBJECT_COLOUR);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  const reset = () => {
    setName("");
    setColour(DEFAULT_SUBJECT_COLOUR);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const captured = { name: trimmed, colour };
    reset();
    onSubmit(captured);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-ocid="subject.dialog"
        className="animate-sheet-in gap-5 rounded-[var(--radius-card)] border-border bg-card sm:max-w-md"
      >
        <DialogHeader className="gap-1.5">
          <DialogTitle className="font-display text-xl font-extrabold text-foreground">
            Add a subject
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Give the class a name and pick the colour for its tab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject-name" className="text-sm font-semibold">
              Subject name
            </Label>
            <Input
              id="subject-name"
              data-ocid="subject.input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mathematics"
              autoComplete="off"
              maxLength={60}
              className="h-11 rounded-2xl border-input bg-background"
            />
          </div>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-semibold">Tab colour</legend>
            <div className="flex flex-wrap gap-2.5">
              {SUBJECT_COLOURS.map((swatch) => {
                const selected = swatch === colour;
                return (
                  <button
                    key={swatch}
                    type="button"
                    data-ocid={`subject.colour.${SUBJECT_COLOURS.indexOf(swatch) + 1}`}
                    aria-label={`Use colour ${swatch}`}
                    aria-pressed={selected}
                    onClick={() => setColour(swatch)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      selected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                        : "hover:scale-105",
                    )}
                    style={{ backgroundColor: swatch }}
                  >
                    {selected && (
                      <Check
                        className="size-5 text-white drop-shadow"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {errorMessage && (
            <p
              data-ocid="subject.error_state"
              role="alert"
              className="rounded-2xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              data-ocid="subject.cancel_button"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-full px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="subject.submit_button"
              disabled={!canSubmit}
              className="h-11 rounded-full bg-gradient-primary px-6 font-semibold shadow-float"
            >
              <Plus className="size-4" aria-hidden="true" />
              {isPending ? "Adding…" : "Add subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
