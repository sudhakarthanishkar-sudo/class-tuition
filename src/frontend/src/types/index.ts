import type { AttendanceStatus, AttendanceView, SubjectView } from "@/backend";

export type { AttendanceStatus, AttendanceView, SubjectView };

/** A subject as rendered in the UI, with its colour normalised to a hex string. */
export interface Subject {
  id: bigint;
  name: string;
  colour: string;
  createdAt: bigint;
}

/** The three attendance states a class can be in. */
export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "classCancelled",
] as const;

export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];

export const STATUS_LABEL: Record<AttendanceStatusValue, string> = {
  present: "Present",
  absent: "Absent",
  classCancelled: "Class Cancelled",
};

export const STATUS_CHIP_CLASS: Record<AttendanceStatusValue, string> = {
  present: "chip-present",
  absent: "chip-absent",
  classCancelled: "chip-cancelled",
};

/** Colour swatches offered in the Add Subject form. */
export const SUBJECT_COLOURS = [
  "#2F9E8F",
  "#E4572E",
  "#7C4DFF",
  "#F2A03D",
  "#D6336C",
  "#3D7DD6",
] as const;

export const DEFAULT_SUBJECT_COLOUR = SUBJECT_COLOURS[0];

/** Convert a Motoko nanosecond timestamp into a JS Date. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local `YYYY-MM-DD` key for a Date, matching the backend DateKey format. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a backend `YYYY-MM-DD` key into a local Date, or null when invalid. */
export function fromDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Short human label such as `12 Sep` for a backend date key. */
export function formatDateKey(key: string): string {
  const date = fromDateKey(key);
  if (!date) return key;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/** Long human label such as `Saturday, 12 September 2026`. */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
