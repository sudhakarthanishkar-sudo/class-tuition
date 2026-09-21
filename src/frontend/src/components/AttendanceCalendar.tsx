import { StatusPicker } from "@/components/StatusPicker";
import { Calendar } from "@/components/ui/calendar";
import {
  formatLongDate,
  fromDateKey,
  isFutureDate,
  toDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import { STATUS_DOT_CLASS } from "@/types/attendance";
import type { AttendanceStatus, AttendanceView } from "@/types/attendance";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

interface AttendanceCalendarProps {
  records: AttendanceView[];
  onRecord: (date: string, status: AttendanceStatus) => void;
  isPending: boolean;
}

/** Small calendar for backfilling attendance on any past date. */
export function AttendanceCalendar({
  records,
  onRecord,
  isPending,
}: AttendanceCalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const statusByDate = new Map<string, AttendanceStatus>();
  for (const record of records) {
    statusByDate.set(record.date, record.status);
  }

  const selectedKey = selected ? toDateKey(selected) : null;
  const selectedStatus = selectedKey
    ? (statusByDate.get(selectedKey) ?? null)
    : null;

  return (
    <section
      data-ocid="attendance.calendar_card"
      className="rounded-[1.375rem] border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"
        >
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-extrabold leading-tight text-foreground">
            Backfill a past date
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick any earlier day to record or correct it.
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          disabled={{ after: new Date() }}
          showOutsideDays={false}
          className="rounded-2xl bg-background/60 p-2"
          modifiers={{
            recorded: records.map((record) => fromDateKey(record.date)),
          }}
          modifiersClassNames={{
            recorded:
              "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-accent",
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {(
          [
            ["present", "Present"],
            ["absent", "Absent"],
            ["classCancelled", "Class Cancelled"],
          ] as const
        ).map(([status, label]) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])}
            />
            {label}
          </span>
        ))}
      </div>

      {selectedKey ? (
        <div className="animate-rise mt-4 rounded-2xl bg-background/70 p-3">
          <p className="text-sm font-semibold text-foreground">
            {formatLongDate(selectedKey)}
          </p>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
            {isFutureDate(selectedKey)
              ? "Future dates cannot be recorded."
              : selectedStatus
                ? "Already recorded — choose a status to update it."
                : "Not recorded yet — choose a status."}
          </p>
          <StatusPicker
            markerPrefix="attendance.calendar"
            value={selectedStatus}
            disabled={isPending || isFutureDate(selectedKey)}
            size="compact"
            onSelect={(status) => onRecord(selectedKey, status)}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-background/70 px-3 py-2.5 text-xs text-muted-foreground">
          Select a date above to record its attendance.
        </p>
      )}
    </section>
  );
}
