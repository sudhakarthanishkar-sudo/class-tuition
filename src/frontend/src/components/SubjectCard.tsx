import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { SwipeToDelete } from "@/components/SwipeToDelete";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

interface SubjectCardProps {
  subject: Subject;
  index: number;
  onDelete: (subject: Subject) => void;
}

/**
 * One subject row: colour swatch, name, and a swipe-right reveal that
 * exposes a red delete action. Tapping the row opens the subject's
 * attendance detail view.
 */
export function SubjectCard({ subject, index, onDelete }: SubjectCardProps) {
  return (
    <SwipeToDelete
      deleteLabel={`Delete ${subject.name}`}
      deleteTestId={`subject.delete_button.${index + 1}`}
      onDelete={() => onDelete(subject)}
    >
      <Link
        to="/subjects/$subjectId"
        params={{ subjectId: subject.id.toString() }}
        data-ocid={`subject.item.${index + 1}`}
        className={cn(
          "flex w-full items-center gap-3.5 rounded-[var(--radius-card)] border border-border bg-card px-4 py-3.5 text-left shadow-subtle transition-smooth",
          "hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span
          aria-hidden="true"
          className="size-10 shrink-0 rounded-2xl shadow-subtle"
          style={{ backgroundColor: subject.colour }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-bold text-foreground">
            {subject.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            Tap to view attendance
          </span>
        </span>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-smooth"
          aria-hidden="true"
        />
      </Link>
    </SwipeToDelete>
  );
}
