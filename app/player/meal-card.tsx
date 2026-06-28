import type { MealPlanDay } from "@/lib/types";
import { CountUp } from "@/components/ui/count-up";

function Meal({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3 border-t border-slate-100 py-3.5 first:border-t-0">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-charge" />
      <div className="min-w-0">
        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-[1.05rem] font-medium leading-snug text-ink">
          {text}
        </p>
      </div>
    </div>
  );
}

// `dayName` and `labels` arrive already translated from the page, so the card
// stays language-agnostic. `day.label`/`day.day` keep their English enum values
// (used for styling + sorting) regardless of UI language.
type MealCardLabels = {
  trainingDay: string;
  restDay: string;
  kcalTarget: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  coachNote: string;
};

export function DayCard({
  day,
  dayName,
  labels,
}: {
  day: MealPlanDay;
  dayName: string;
  labels: MealCardLabels;
}) {
  const isTraining = day.label === "Training Day";
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-[0_14px_44px_-18px_rgba(11,20,16,0.35)] ring-1 ring-black/5">
      {/* Header — Training = energy gradient, Rest = calm gradient.
          Kept high-contrast (white on saturated color) for sunlight. */}
      <div
        className={`relative px-5 py-5 ${
          isTraining
            ? "bg-gradient-to-br from-[#0a8f6a] via-[#10b981] to-[#34d399]"
            : "bg-gradient-to-br from-[#26413a] to-[#0f1d17]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-30" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/75">
              {isTraining ? labels.trainingDay : labels.restDay}
            </p>
            <h2 className="font-display text-3xl font-semibold text-white">
              {dayName}
            </h2>
          </div>

          {/* Calorie "achievement badge" — counts up on view */}
          <div className="rounded-2xl bg-black/25 px-4 py-2.5 text-right ring-1 ring-white/15 backdrop-blur">
            <p className="tabular text-[1.75rem] font-bold leading-none text-white">
              <CountUp value={day.estimated_calories} />
            </p>
            <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/70">
              {labels.kcalTarget}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <Meal label={labels.breakfast} text={day.breakfast} />
        <Meal label={labels.lunch} text={day.lunch} />
        <Meal label={labels.dinner} text={day.dinner} />
        <Meal label={labels.snacks} text={day.snacks} />
      </div>

      {day.focus_note && (
        <div
          className={`mx-5 mb-5 rounded-2xl border-l-[3px] px-4 py-3 ${
            isTraining
              ? "border-charge bg-emerald-50"
              : "border-slate-400 bg-slate-50"
          }`}
        >
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-charge-deep">
            {labels.coachNote}
          </p>
          <p className="mt-1 text-[0.95rem] font-medium italic leading-snug text-slate-800">
            {day.focus_note}
          </p>
        </div>
      )}
    </section>
  );
}
