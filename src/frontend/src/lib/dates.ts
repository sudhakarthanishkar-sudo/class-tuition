/** Local-date helpers. Date keys are always `YYYY-MM-DD` in the user's timezone. */

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** "12 Sep" — the compact label used in the attendance list. */
export function formatShortDate(key: string): string {
  const date = fromDateKey(key);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Monday, 12 September 2026" — the long label used in the mark-today card. */
export function formatLongDate(key: string): string {
  const date = fromDateKey(key);
  if (Number.isNaN(date.getTime())) return key;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isFutureDate(key: string): boolean {
  return key > todayKey();
}
