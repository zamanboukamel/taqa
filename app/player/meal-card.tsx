import type { MealPlanDay } from "@/lib/types";

function Meal({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-slate-200 py-3">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg leading-snug text-slate-900">{text}</p>
    </div>
  );
}

export function DayCard({ day }: { day: MealPlanDay }) {
  const isTraining = day.label === "Training Day";
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          isTraining ? "bg-emerald-700" : "bg-slate-800"
        }`}
      >
        <div>
          <h2 className="text-2xl font-extrabold text-white">{day.day}</h2>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            {day.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold leading-none text-white">
            {day.estimated_calories.toLocaleString()}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            kcal
          </p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <Meal label="Breakfast" text={day.breakfast} />
        <Meal label="Lunch" text={day.lunch} />
        <Meal label="Dinner" text={day.dinner} />
        <Meal label="Snacks" text={day.snacks} />
      </div>

      {day.focus_note && (
        <div
          className={`px-5 py-3 text-base font-semibold ${
            isTraining
              ? "bg-emerald-50 text-emerald-900"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {day.focus_note}
        </div>
      )}
    </section>
  );
}
