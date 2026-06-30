import type { RamadanPlanJson, RamadanDay, RamadanSegment } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CountUp } from "@/components/ui/count-up";

// Sunday-first (GCC week), regardless of the order the plan came back in.
const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// A fasted session sits on amber (caution); a fed session on charge green.
const SCENARIO_STYLE: Record<string, string> = {
  before_iftar: "bg-amber-100 text-amber-900 ring-amber-300/60",
  after_suhoor: "bg-amber-100 text-amber-900 ring-amber-300/60",
  after_iftar: "bg-emerald-100 text-emerald-900 ring-emerald-300/60",
  none: "bg-slate-100 text-slate-600 ring-slate-300/60",
};

// Each block gets a small colored dot so the day reads as a timeline.
const SEGMENT_DOT: Record<RamadanSegment["key"], string> = {
  suhoor: "bg-indigo-400",
  iftar: "bg-amber-400",
  post_iftar: "bg-charge",
  pre_suhoor: "bg-violet-400",
  meal: "bg-charge",
};

export function RamadanPlan({
  plan,
  t,
}: {
  plan: RamadanPlanJson;
  t: Dictionary;
}) {
  const days = [...plan.days].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <RamadanDayCard key={day.day} day={day} t={t} />
      ))}
    </div>
  );
}

function RamadanDayCard({ day, t }: { day: RamadanDay; t: Dictionary }) {
  const dayName = t.days[day.day as keyof typeof t.days] ?? day.day;
  const isTraining = day.label === "Training Day";
  const scenarioLabel =
    t.ramadan.scenario[day.training_scenario as keyof typeof t.ramadan.scenario];

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_44px_-18px_rgba(11,20,16,0.35)] ring-1 ring-black/5">
      {/* Header — deep night gradient to signal the fasted day. */}
      <div className="relative bg-gradient-to-br from-[#1a2740] via-[#16233a] to-[#0f1d17] px-5 py-5">
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-20" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white/80">
                {day.is_fasting
                  ? t.ramadan.fastingBadge
                  : t.ramadan.notFastingBadge}
              </span>
              {isTraining && day.training_scenario !== "none" && (
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] ring-1 ${
                    SCENARIO_STYLE[day.training_scenario]
                  }`}
                >
                  {scenarioLabel}
                </span>
              )}
            </div>
            <h2 className="font-display mt-1.5 text-3xl font-semibold text-white">
              {dayName}
            </h2>
            {(day.iftar_time || day.suhoor_time) && (
              <p className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-white/60">
                {day.suhoor_time ? `${t.ramadan.suhoorShort} ${day.suhoor_time}` : ""}
                {day.suhoor_time && day.iftar_time ? " · " : ""}
                {day.iftar_time ? `${t.ramadan.iftarShort} ${day.iftar_time}` : ""}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-black/25 px-4 py-2.5 text-right ring-1 ring-white/15 backdrop-blur">
            <p className="tabular text-[1.75rem] font-bold leading-none text-white">
              <CountUp value={day.estimated_calories} />
            </p>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/70">
              {t.mealCard.kcalTarget}
            </p>
          </div>
        </div>
      </div>

      {/* Segments — the eating timeline. */}
      <div className="px-5 py-2">
        {day.segments.map((seg, i) => (
          <Segment key={i} seg={seg} tag={t.ramadan.segmentTag} />
        ))}
      </div>

      {/* Hydration — first-class, always shown. */}
      <div className="mx-5 mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <DropIcon />
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-sky-700">
            {t.ramadan.hydrationLabel}
          </p>
        </div>
        <p className="mt-1 text-[0.92rem] font-medium leading-snug text-sky-950">
          {day.hydration}
        </p>
      </div>

      {day.focus_note && (
        <div className="mx-5 mb-5 rounded-2xl border-l-[3px] border-charge bg-emerald-50 px-4 py-3">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-charge-deep">
            {t.mealCard.coachNote}
          </p>
          <p className="mt-1 text-[0.95rem] font-medium italic leading-snug text-slate-800">
            {day.focus_note}
          </p>
        </div>
      )}
    </section>
  );
}

function Segment({
  seg,
  tag,
}: {
  seg: RamadanSegment;
  tag: Dictionary["ramadan"]["segmentTag"];
}) {
  return (
    <div className="flex gap-3 border-t border-slate-100 py-3.5 first:border-t-0">
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${SEGMENT_DOT[seg.key]}`}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            {tag[seg.key]}
          </p>
          {seg.time && (
            <span className="tabular text-[0.66rem] font-semibold text-slate-400">
              {seg.time}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[1.05rem] font-semibold leading-snug text-ink">
          {seg.title}
        </p>
        <p className="mt-0.5 text-[0.9rem] leading-snug text-slate-600">
          {seg.foods}
        </p>
        <p className="mt-1 text-[0.82rem] italic leading-snug text-slate-500">
          {seg.focus}
        </p>
      </div>
    </div>
  );
}

function DropIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3s6 6.4 6 10.5A6 6 0 016 13.5C6 9.4 12 3 12 3z"
        stroke="#0369a1"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
