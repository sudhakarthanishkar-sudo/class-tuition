import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { AttendanceRow } from "@/components/AttendanceRow";
import { MarkTodayCard } from "@/components/MarkTodayCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAttendance,
  useAttendanceSummary,
  useDeleteAttendance,
  useRecordAttendance,
} from "@/hooks/useQueries";
import { todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, SubjectView } from "@/types/attendance";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarOff } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface SubjectPageProps {
  subject: SubjectView;
}

export function SubjectPage({ subject }: SubjectPageProps) {
  const attendanceQuery = useAttendance(subject.id);
  const summary = useAttendanceSummary();
  const recordAttendance = useRecordAttendance();
  const deleteAttendance = useDeleteAttendance();

  const records = useMemo(() => {
    const list = attendanceQuery.data ?? [];
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [attendanceQuery.data]);

  const today = todayKey();
  const todayStatus =
    records.find((record) => record.date === today)?.status ?? null;

  function handleRecord(date: string, status: AttendanceStatus) {
    recordAttendance.mutate(
      { subjectId: subject.id, date, status },
      {
        onSuccess: () => {
          toast.success(
            date === today ? "Today's attendance saved" : "Attendance updated",
          );
        },
        onError: () => {
          toast.error("Could not save that attendance. Try again.");
        },
      },
    );
  }

  return (
    <div data-ocid="subject.page" className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          data-ocid="subject.back_link"
          aria-label="Back to all subjects"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-subtle transition-smooth hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-extrabold leading-tight text-foreground">
            {subject.name}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: subject.colour }}
            />
            Attendance record
          </p>
        </div>
      </div>

      <MarkTodayCard
        todayStatus={todayStatus}
        onSelect={(status) => handleRecord(today, status)}
        isPending={recordAttendance.isPending}
      />

      <AttendanceCalendar
        records={records}
        onRecord={handleRecord}
        isPending={recordAttendance.isPending}
      />

      {!summary.isLoading ? (
        <p
          data-ocid="attendance.summary"
          className="px-1 text-sm font-medium text-muted-foreground"
        >
          You have marked{" "}
          <strong className="font-bold text-foreground">
            {summary.totalClasses}
          </strong>{" "}
          {summary.totalClasses === 1 ? "class" : "classes"} in total, across{" "}
          <strong className="font-bold text-foreground">
            {summary.subjectsWithRecords}
          </strong>{" "}
          {summary.subjectsWithRecords === 1 ? "subject" : "subjects"}.
        </p>
      ) : null}

      <section data-ocid="attendance.section" className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 className="font-display text-lg font-extrabold text-foreground">
            Recorded dates
          </h2>
          {records.length > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">
              {records.length} {records.length === 1 ? "entry" : "entries"}
            </span>
          ) : null}
        </div>

        {attendanceQuery.isLoading ? (
          <ul data-ocid="attendance.loading_state" className="space-y-2.5">
            {Array.from(
              { length: 4 },
              (_, i) => `attendance-skeleton-${i}`,
            ).map((id) => (
              <li key={id}>
                <Skeleton className="h-[4.25rem] rounded-[1.375rem]" />
              </li>
            ))}
          </ul>
        ) : attendanceQuery.isError ? (
          <div
            data-ocid="attendance.error_state"
            className="rounded-[1.375rem] border border-destructive/30 bg-card p-5 text-center shadow-subtle"
          >
            <p className="font-display text-base font-bold text-foreground">
              Could not load this attendance
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <button
              type="button"
              data-ocid="attendance.retry_button"
              onClick={() => void attendanceQuery.refetch()}
              className="mt-3 min-h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <div
            data-ocid="attendance.empty_state"
            className="rounded-[1.375rem] border border-dashed border-border bg-card/70 px-5 py-8 text-center"
          >
            <span
              aria-hidden="true"
              className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"
            >
              <CalendarOff className="size-6" />
            </span>
            <p className="mt-3 font-display text-base font-bold text-foreground">
              No attendance recorded yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
              Mark today&rsquo;s class above, or pick a past date on the
              calendar to backfill it.
            </p>
          </div>
        ) : (
          <ul
            data-ocid="attendance.list"
            className={cn("space-y-2.5", "animate-rise")}
          >
            {records.map((record, index) => (
              <AttendanceRow
                key={record.id.toString()}
                record={record}
                index={index}
                onDelete={(id) => {
                  deleteAttendance.mutate(
                    { id, subjectId: subject.id },
                    {
                      onSuccess: () => {
                        toast.success("Attendance record deleted");
                      },
                      onError: () => {
                        toast.error("Could not delete that record. Try again.");
                      },
                    },
                  );
                }}
                onChangeStatus={handleRecord}
                isDeleting={deleteAttendance.isPending}
                isUpdating={recordAttendance.isPending}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
