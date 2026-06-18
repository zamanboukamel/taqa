"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TrainingSchedule } from "@/lib/types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

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

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Weekly training schedule</h2>
      <p className="mt-1 text-sm text-slate-600">
        Tick the days with training and set the session start time. Unticked days
        are treated as rest days.
      </p>

      <div className="mt-4 space-y-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
          >
            <label className="flex flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={days[day].enabled}
                onChange={(e) => update(day, { enabled: e.target.checked })}
                className="h-5 w-5"
              />
              <span className="text-base font-medium text-slate-900">{day}</span>
            </label>
            <input
              type="time"
              value={days[day].time}
              disabled={!days[day].enabled}
              onChange={(e) => update(day, { time: e.target.value })}
              className="rounded-lg border border-slate-300 px-2 py-1 text-base text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
      {savedAt && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Schedule saved at {savedAt}.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save schedule"}
      </button>
    </section>
  );
}
