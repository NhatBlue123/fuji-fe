import { TimeRange, Weekday } from "./types";

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "MON", label: "T2" },
  { key: "TUE", label: "T3" },
  { key: "WED", label: "T4" },
  { key: "THU", label: "T5" },
  { key: "FRI", label: "T6" },
  { key: "SAT", label: "T7" },
  { key: "SUN", label: "CN" },
];

export const VND_PER_BLOSSOM = 1000;

export function toBlossom(vnd: number) {
  return Math.floor((vnd || 0) / VND_PER_BLOSSOM);
}

export function getWeekdayCodeFromDate(dateStr: string): Weekday | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const map: Record<number, Weekday> = {
    0: "SUN",
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
    6: "SAT",
  };
  return map[day] ?? null;
}

export function hasInvalidRange(ranges: TimeRange[]) {
  return ranges.some((r) => !r.start || !r.end || r.start >= r.end);
}

export function hasOverlap(ranges: TimeRange[]) {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) return true;
  }
  return false;
}

export function estimateSlots(
  dateFrom: string,
  dateTo: string,
  daysOfWeek: Weekday[],
  timeRangesCount: number
) {
  if (!dateFrom || !dateTo || !daysOfWeek.length || timeRangesCount <= 0) return 0;
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  if (end < start) return 0;

  const map: Record<Weekday, number> = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
    SUN: 0,
  };

  let countDays = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (daysOfWeek.some((d) => map[d] === cur.getDay())) countDays++;
    cur.setDate(cur.getDate() + 1);
  }
  return countDays * timeRangesCount;
}
