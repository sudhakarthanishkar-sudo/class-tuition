import type { AttendanceView, SubjectView } from "@/backend";
import { AttendanceStatus } from "@/backend";

export { AttendanceStatus };
export type { AttendanceView, SubjectView };

/** The three attendance states, in the order they appear in the UI. */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.present,
  AttendanceStatus.absent,
  AttendanceStatus.classCancelled,
];

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  [AttendanceStatus.present]: "Present",
  [AttendanceStatus.absent]: "Absent",
  [AttendanceStatus.classCancelled]: "Class Cancelled",
};

export const STATUS_CHIP_CLASS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.present]: "chip-present",
  [AttendanceStatus.absent]: "chip-absent",
  [AttendanceStatus.classCancelled]: "chip-cancelled",
};

export const STATUS_DOT_CLASS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.present]: "bg-success",
  [AttendanceStatus.absent]: "bg-destructive",
  [AttendanceStatus.classCancelled]: "bg-warning",
};

/** A subject paired with the attendance records loaded for it. */
export interface SubjectWithAttendance {
  subject: SubjectView;
  records: AttendanceView[];
}
