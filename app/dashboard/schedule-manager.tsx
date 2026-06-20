"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import type { TrainingSchedule } from "@/lib/types";

// Sunday-first: the working week across the GCC starts on Sunday.
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

type DayState = { enabled: boolean; time: string };

export default function ScheduleManager({
  academyId,
  schedules,
}: {
  academyId: string;
  schedules: TrainingSchedule[];
}) {
  const router = useRouter();

  // Build initial state from existing rows (a row means "training day").
  const initial: Record<string, DayState> = {};
  for (const day of DAYS) {
    const existing = schedules.find((s) => s.day_of_week === day);
    initial[day] = {
      enabled: Boolean(existing),
      time: existing?.session_time ?? "16:00",
    };
  }

  const [days, setDays] = useState<Record<string, DayState>>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function update(day: string, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setSavedAt(null);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSavedAt(null);
    try {
      const supabase = createClient();

      // Replace the whole schedule: delete existing, then insert enabled days.
      const { error: delError } = await supabase
        .from("training_schedules")
        .delete()
        .eq("academy_id", academyId);
      if (delError) throw delError;

      const rows = DAYS.filter((d) => days[d].enabled).map((d) => ({
        academy_id: academyId,
        day_of_week: d,
        session_time: days[d].time,
      }));

      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from("training_schedules")
          .insert(rows);
        if (insError) throw insError;
      }

      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the schedule.",
      );
    } finally {
      setLoading(false);
    }
  }

  const enabledDays = DAYS.filter((d) => days[d].enabled);

  return (
    <div className="tq-card p-6">
      <h2 className="font-display text-2xl font-semibold text-white">
        Weekly training schedule
      </h2>
      <p className="mt-1 text-sm text-mist">
        Tap the days with training. Untapped days become rest days — the plan
        fuels and recovers accordingly.
      </p>

      {/* Day pills — the visual week */}
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day) => {
          const on = days[day].enabled;
          return (
            <button
              key={day}
              type="button"
              onClick={() => update(day, { enabled: !on })}
              aria-pressed={on}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                on
                  ? "border-transparent bg-gradient-to-b from-volt to-charge text-midnight shadow-[0_6px_18px_-8px_rgba(16,185,129,0.7)]"
                  : "border-pitch-line bg-black/20 text-mist hover:border-charge/40 hover:text-white"
              }`}
            >
              {SHORT[day]}
              <span
                className={`h-1 w-1 rounded-full ${
                  on ? "bg-midnight/60" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Session times — only for training days */}
      {enabledDays.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-xs uppercase tracking-widest text-mist-2">
            Session times
          </p>
          <div className="mt-3 space-y-2">
            {enabledDays.map((day) => (
              <div
                key={day}
                className="flex items-center justify-between rounded-xl border border-pitch-line bg-black/20 px-4 py-2.5"
              >
                <span className="text-sm font-medium text-white">{day}</span>
                <input
                  type="time"
                  value={days[day].time}
                  onChange={(e) => update(day, { time: e.target.value })}
                  className="rounded-lg border border-pitch-line bg-midnight px-2.5 py-1.5 text-sm text-white [color-scheme:dark] focus:border-charge focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="tq-alert-error mt-4">
          {error}
        </p>
      )}
      {savedAt && (
        <p className="tq-alert-ok mt-4">Schedule saved at {savedAt}.</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="tq-btn tq-btn-primary mt-5 w-full py-3"
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4 !border-midnight/30 !border-t-midnight" />
            Saving…
          </>
        ) : (
          "Save schedule"
        )}
      </button>
    </div>
  );
}
