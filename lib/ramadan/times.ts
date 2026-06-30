// Prayer-times integration (Aladhan — free, no API key).
//
// We only need two timings per day:
//   • suhoor cutoff  = Fajr  (dawn; the pre-dawn meal must finish by then)
//   • iftar          = Maghrib (sunset; the fast is broken)
//
// Everything is wrapped behind one function with a graceful failure mode: if
// the network call fails, callers fall back to manually-entered times.

export type DayTimes = { suhoor: string; iftar: string };

const ALADHAN_BASE = "https://api.aladhan.com/v1/timingsByCity";

// Aladhan returns times like "04:13 (+03)" or "18:30" — keep just "HH:MM".
function clean(time: string | undefined): string | null {
  if (!time) return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

// dateISO is "yyyy-mm-dd"; Aladhan wants "DD-MM-YYYY" in the path.
function toAladhanDate(dateISO: string): string {
  const [y, mo, d] = dateISO.split("-");
  return `${d}-${mo}-${y}`;
}

/**
 * Fetch suhoor (Fajr) and iftar (Maghrib) for a city on a given date.
 * Returns null on any failure so the caller can fall back to manual input.
 */
export async function fetchRamadanTimes(
  city: string,
  country: string,
  dateISO: string,
): Promise<DayTimes | null> {
  try {
    const url =
      `${ALADHAN_BASE}/${toAladhanDate(dateISO)}` +
      `?city=${encodeURIComponent(city)}` +
      `&country=${encodeURIComponent(country)}`;

    // Don't let a slow third party hang plan generation.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      // These rarely change; let Next cache them for a day.
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: { timings?: { Fajr?: string; Maghrib?: string } };
    };
    const suhoor = clean(json.data?.timings?.Fajr);
    const iftar = clean(json.data?.timings?.Maghrib);
    if (!suhoor || !iftar) return null;
    return { suhoor, iftar };
  } catch {
    return null;
  }
}
