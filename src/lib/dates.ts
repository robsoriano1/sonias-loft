/* Small, dependency-free date helpers. Everything is handled as a
   "YYYY-MM-DD" string so there are no timezone surprises between the
   browser (Manila) and the server (wherever Vercel puts it). */

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/** "2026-09-04" for a given year/month(0-11)/day */
export function toKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Today in the visitor's local timezone, as YYYY-MM-DD */
export function todayKey(): string {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** 0 = Sunday. How many blank cells before the 1st. */
export function leadingBlanks(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Build the grid for one month: nulls for padding, day numbers otherwise. */
export function monthGrid(year: number, month: number): (number | null)[] {
  const cells: (number | null)[] = [];
  for (let i = 0; i < leadingBlanks(year, month); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function addMonths(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** "4 Sep 2026" - short, human, unambiguous */
export function formatDateKey(key: string | null): string {
  if (!key) return "-";
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day} ${month} - ${time}`;
}

/** Every day between check-in and check-out, inclusive of start, exclusive of end. */
export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const out: string[] = [];
  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  const cursor = new Date(start);
  while (cursor < end) {
    out.push(toKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
