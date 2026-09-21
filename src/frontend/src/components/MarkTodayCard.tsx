import { StatusPicker } from "@/components/StatusPicker";
import { formatLongDate, todayKey } from "@/lib/dates";
import type { AttendanceStatus } from "@/types/attendance";
import { CalendarCheck } from "lucide-react";

interface MarkTodayCardProps {
  todayStatus: AttendanceStatus | null;
  onSelect: (status: AttendanceStatus) => void;
  isPending: boolean;
}

/** Sticky primary action: record today's attendance in one tap. */
export function MarkTodayCard({
  todayStatus,
  onSelect,
  isPending,
}: MarkTodayCardProps) {
  const today = todayKey();

  return (
    <section
      data-ocid="attendance.mark_today_card"
      className="sticky top-[4.75rem] z-20 rounded-[1.375rem] border border-border bg-card p-4 shadow-elevated"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-foreground"
        >
          <CalendarCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold leading-tight text-foreground">
            Mark today&rsquo;s attendance
          </h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {formatLongDate(today)}
          </p>
        </div>
      </div>

      <div className="mt-3.5">
        <StatusPicker
          markerPrefix="attendance.today"
          value={todayStatus}
          onSelect={onSelect}
          disabled={isPending}
        />
      </div>

      <p className="mt-2.5 text-xs text-muted-foreground">
        {isPending
          ? "Saving…"
          : todayStatus
            ? "Tap another status to change today's record."
            : "Pick a status to record today's class."}
      </p>
    </section>
  );
}
