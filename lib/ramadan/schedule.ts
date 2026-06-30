// Pure date/time helpers for Ramadan plan generation. No I/O, no Date.now()
// surprises — the caller passes in "today" so behaviour is deterministic.

import type { RamadanTrainingScenario } from "@/lib/types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// "HH:MM" -> minutes since midnight, or null if unparseable.
export function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// Today's date in the academy's locale, as "yyyy-mm-dd". Uses UTC parts to
// avoid the off-by-one that local timezones introduce around midnight.
export function todayISO(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The 7 consecutive dates of the Ramadan window, starting at `startISO`.
export function windowDates(startISO: string, length = 7): string[] {
  return Array.from({ length }, (_, i) => addDaysISO(startISO, i));
}

// Weekday name for an ISO date (UTC), e.g. "Sunday".
export function weekdayOf(dateISO: string): (typeof WEEKDAYS)[number] {
  const d = new Date(`${dateISO}T00:00:00Z`);
  return WEEKDAYS[d.getUTCDay()];
}

/**
 * Classify the day's training relative to the fast. This is computed
 * server-side (not left to the model) so the plan's scenario is deterministic.
 *
 *  - no training that day .......................... "none"
 *  - trains after sunset (fed) ..................... "after_iftar"
 *  - trains in the morning, long way to iftar ...... "after_suhoor"
 *  - otherwise (fasted, finishing near sunset) ..... "before_iftar"
 */
export function computeScenario(opts: {
  isTraining: boolean;
  isFasting: boolean;
  trainingTime: string | null;
  iftar: string | null;
  suhoor: string | null;
}): RamadanTrainingScenario {
  const { isTraining, isFasting, trainingTime, iftar, suhoor } = opts;
  if (!isTraining) return "none";

  const t = toMinutes(trainingTime);
  const i = toMinutes(iftar);
  // Non-fasting athletes eat normally; the "fasted vs fed" axis doesn't apply,
  // but we still surface when they train relative to the shifted day.
  if (t === null || i === null) return isFasting ? "before_iftar" : "after_iftar";

  // Training starts after sunset => fed.
  if (t >= i) return "after_iftar";

  // Morning session a long way before iftar (≥ 3h) => after_suhoor.
  const s = toMinutes(suhoor);
  if (i - t >= 180 && (s === null || t >= s)) return "after_suhoor";

  // Default fasted case: trains in the hours leading up to iftar.
  return "before_iftar";
}
