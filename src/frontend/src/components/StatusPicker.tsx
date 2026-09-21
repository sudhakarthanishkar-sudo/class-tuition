import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUSES, STATUS_LABEL } from "@/types/attendance";
import type { AttendanceStatus } from "@/types/attendance";

const ACTIVE_CLASS: Record<AttendanceStatus, string> = {
  present: "border-success bg-success text-success-foreground",
  absent: "border-destructive bg-destructive text-destructive-foreground",
  classCancelled: "border-warning bg-warning text-warning-foreground",
};

interface StatusPickerProps {
  value: AttendanceStatus | null;
  onSelect: (status: AttendanceStatus) => void;
  disabled?: boolean;
  /** Distinguishes the marker prefix for each button, e.g. "today" or "calendar". */
  markerPrefix: string;
  size?: "default" | "compact";
}

/** The three-way Present / Absent / Class Cancelled control. */
export function StatusPicker({
  value,
  onSelect,
  disabled = false,
  markerPrefix,
  size = "default",
}: StatusPickerProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        size === "default" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-3",
      )}
    >
      {ATTENDANCE_STATUSES.map((status) => {
        const isActive = value === status;
        return (
          <button
            key={status}
            type="button"
            data-ocid={`${markerPrefix}.status.${status}`}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onSelect(status)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full border font-semibold transition-smooth",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              "disabled:cursor-not-allowed disabled:opacity-60",
              size === "default"
                ? "min-h-11 px-4 text-sm"
                : "min-h-9 px-2 text-xs",
              isActive
                ? ACTIVE_CLASS[status]
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-full",
                isActive ? "bg-current" : "bg-muted-foreground/50",
              )}
            />
            <span className="truncate">{STATUS_LABEL[status]}</span>
          </button>
        );
      })}
    </div>
  );
}
