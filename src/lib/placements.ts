/**
 * Daily placements for the How we work heatmap.
 *
 * ILLUSTRATIVE: until SGI supplies real figures, this spreads the approved
 * total (450 since June 2025) across weekdays, rising over time with the odd
 * cohort day. It is seeded, so every build draws the same chart. To use real
 * data, replace `illustrativeCounts` with actual counts per day.
 */
export interface PlacementDay {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  count: number;
  /** 0 (none) to 4 (most). */
  level: 0 | 1 | 2 | 3 | 4;
  /** Column (week) and row (Monday = 0). */
  col: number;
  row: number;
}

export interface PlacementCalendar {
  days: PlacementDay[];
  weeks: number;
  months: { label: string; col: number }[];
  total: number;
}

const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const parse = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function levelOf(count: number): PlacementDay['level'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/** Spreads `total` over the weekdays between `start` and `end` (inclusive). */
function illustrativeCounts(dates: number[], total: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const span = dates.length - 1 || 1;
  let nextCohort = 12;
  const weights = dates.map((ms, i) => {
    const weekday = new Date(ms).getUTCDay();
    if (weekday === 0 || weekday === 6) return rand() < 0.05 ? 0.25 : 0;
    const t = i / span;
    let w = (0.35 + 1.15 * t ** 1.2) * (0.25 + rand() * 1.5);
    if (rand() < 0.16) w = 0;
    if (--nextCohort <= 0) {
      w *= 3.6;
      nextCohort = 14 + Math.floor(rand() * 10);
    }
    return w;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const counts = exact.map(Math.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  const order = exact.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k++, left--) counts[order[k % order.length]![1]]! += 1;
  return counts;
}

export function placementCalendar(start: string, end: string, total: number, seed = 450): PlacementCalendar {
  const first = parse(start);
  const last = parse(end);
  // Columns start on the Monday of the first week.
  const monday = first - ((new Date(first).getUTCDay() + 6) % 7) * DAY;
  const dates: number[] = [];
  for (let ms = first; ms <= last; ms += DAY) dates.push(ms);
  const counts = illustrativeCounts(dates, total, seed);

  const days: PlacementDay[] = dates.map((ms, i) => {
    const offset = Math.round((ms - monday) / DAY);
    const count = counts[i] ?? 0;
    return { date: iso(ms), count, level: levelOf(count), col: Math.floor(offset / 7), row: offset % 7 };
  });

  const weeks = (days.at(-1)?.col ?? 0) + 1;
  const months: { label: string; col: number }[] = [];
  let seen = -1;
  for (let col = 0; col < weeks; col++) {
    // Label by the first day actually shown in the column (the first week can start mid-week).
    const d = new Date(Math.max(monday + col * 7 * DAY, first));
    const m = d.getUTCMonth();
    if (m !== seen) {
      // Skip a label that would sit under the previous one.
      if (months.length === 0 || col - months.at(-1)!.col >= 3) {
        months.push({ label: m === 0 ? `${MONTHS[m]} ${String(d.getUTCFullYear()).slice(2)}` : MONTHS[m]!, col });
      }
      seen = m;
    }
  }

  return { days, weeks, months, total: counts.reduce((a, b) => a + b, 0) };
}
