"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import { Toggle } from "@/components/ui/toggle";
import { useI18n } from "@/components/i18n/language-provider";
import type { RamadanDayTimes } from "@/lib/types";

type TimeRow = {
  day_date: string;
  weekday: string;
  suhoor: string;
  iftar: string;
};

export default function RamadanSettings({
  academyId,
  initialMode,
  initialCity,
  initialCountry,
  initialStartDate,
  initialTimes,
}: {
  academyId: string;
  initialMode: boolean;
  initialCity: string;
  initialCountry: string;
  initialStartDate: string | null;
  initialTimes: RamadanDayTimes[];
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [mode, setMode] = useState(initialMode);
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [rows, setRows] = useState<TimeRow[]>(
    [...initialTimes]
      .sort((a, b) => a.day_date.localeCompare(b.day_date))
      .map((r) => ({
        day_date: r.day_date,
        weekday: weekdayOf(r.day_date),
        suhoor: r.suhoor_time,
        iftar: r.iftar_time,
      })),
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTimes, setSavingTimes] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings() {
    setSavingSettings(true);
    setError(null);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("academies")
        .update({
          ramadan_mode: mode,
          city: city.trim() || "Doha",
          country: country.trim() || "Qatar",
          ramadan_start_date: startDate || null,
        })
        .eq("id", academyId);
      if (error) throw error;
      setMsg(t.ramadan.settingsSaved);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ramadan.settingsError);
    } finally {
      setSavingSettings(false);
    }
  }

  async function autoFill() {
    setAutofilling(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/ramadan-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academyId, startDate: startDate || undefined }),
      });
      const data = (await res.json()) as {
        times?: Array<{
          day_date: string;
          weekday: string;
          suhoor: string | null;
          iftar: string | null;
        }>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || t.ramadan.fetchError);
      setRows(
        (data.times ?? []).map((r) => ({
          day_date: r.day_date,
          weekday: r.weekday,
          suhoor: r.suhoor ?? "",
          iftar: r.iftar ?? "",
        })),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ramadan.fetchError);
    } finally {
      setAutofilling(false);
    }
  }

  function updateRow(date: string, patch: Partial<TimeRow>) {
    setRows((prev) =>
      prev.map((r) => (r.day_date === date ? { ...r, ...patch } : r)),
    );
  }

  async function saveTimes() {
    setSavingTimes(true);
    setError(null);
    setMsg(null);
    try {
      const supabase = createClient();
      const payload = rows
        .filter((r) => r.suhoor && r.iftar)
        .map((r) => ({
          academy_id: academyId,
          day_date: r.day_date,
          suhoor_time: r.suhoor,
          iftar_time: r.iftar,
          source: "manual",
        }));
      if (payload.length) {
        const { error } = await supabase
          .from("ramadan_days")
          .upsert(payload, { onConflict: "academy_id,day_date" });
        if (error) throw error;
      }
      setMsg(t.ramadan.timesSaved);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ramadan.timesError);
    } finally {
      setSavingTimes(false);
    }
  }

  return (
    <div className="tq-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            {t.ramadan.settingsTitle}
          </h2>
          <p className="mt-1 max-w-md text-sm text-mist">
            {t.ramadan.settingsSubtitle}
          </p>
        </div>
        <Toggle
          checked={mode}
          onChange={setMode}
          label={t.ramadan.modeLabel}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="r-city" className="tq-label">
            {t.ramadan.cityLabel}
          </label>
          <input
            id="r-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Doha"
            className="tq-field"
          />
        </div>
        <div>
          <label htmlFor="r-country" className="tq-label">
            {t.ramadan.countryLabel}
          </label>
          <input
            id="r-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Qatar"
            className="tq-field"
          />
        </div>
        <div>
          <label htmlFor="r-start" className="tq-label">
            {t.ramadan.startDateLabel}
          </label>
          <input
            id="r-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="tq-field [color-scheme:dark]"
          />
          <p className="mt-1 text-xs text-mist-2">{t.ramadan.startDateHint}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="tq-btn tq-btn-primary px-5 py-2.5 text-sm"
        >
          {savingSettings ? (
            <>
              <Spinner className="h-4 w-4 !border-midnight/30 !border-t-midnight" />
              {t.common.saving}
            </>
          ) : (
            t.ramadan.saveSettings
          )}
        </button>
        <button
          onClick={autoFill}
          disabled={autofilling}
          className="tq-btn tq-btn-ghost px-5 py-2.5 text-sm"
        >
          {autofilling ? (
            <>
              <Spinner className="h-4 w-4" />
              {t.ramadan.autoFilling}
            </>
          ) : (
            t.ramadan.autoFill
          )}
        </button>
      </div>

      {/* Prayer-times editor */}
      {rows.length > 0 && (
        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-widest text-mist-2">
            {t.ramadan.timesTitle}
          </p>
          <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2">
            <span />
            <span className="text-center font-mono text-[0.62rem] uppercase tracking-wide text-mist-2">
              {t.ramadan.suhoorCol}
            </span>
            <span className="text-center font-mono text-[0.62rem] uppercase tracking-wide text-mist-2">
              {t.ramadan.iftarCol}
            </span>
            {rows.map((r) => (
              <Row key={r.day_date} r={r} t={t} onChange={updateRow} />
            ))}
          </div>
          <button
            onClick={saveTimes}
            disabled={savingTimes}
            className="tq-btn tq-btn-ghost mt-4 px-5 py-2.5 text-sm"
          >
            {savingTimes ? (
              <>
                <Spinner className="h-4 w-4" />
                {t.common.saving}
              </>
            ) : (
              t.ramadan.saveTimes
            )}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="tq-alert-error mt-4">
          {error}
        </p>
      )}
      {msg && <p className="tq-alert-ok mt-4">{msg}</p>}
    </div>
  );
}

function Row({
  r,
  t,
  onChange,
}: {
  r: TimeRow;
  t: ReturnType<typeof useI18n>["t"];
  onChange: (date: string, patch: Partial<TimeRow>) => void;
}) {
  const weekday = t.days[r.weekday as keyof typeof t.days] ?? r.weekday;
  return (
    <>
      <span className="text-sm text-white">
        {weekday}
        <span className="ml-2 font-mono text-xs text-mist-2">{r.day_date}</span>
      </span>
      <input
        type="time"
        value={r.suhoor}
        onChange={(e) => onChange(r.day_date, { suhoor: e.target.value })}
        className="rounded-lg border border-pitch-line bg-midnight px-2.5 py-1.5 text-sm text-white [color-scheme:dark] focus:border-charge focus:outline-none"
      />
      <input
        type="time"
        value={r.iftar}
        onChange={(e) => onChange(r.day_date, { iftar: e.target.value })}
        className="rounded-lg border border-pitch-line bg-midnight px-2.5 py-1.5 text-sm text-white [color-scheme:dark] focus:border-charge focus:outline-none"
      />
    </>
  );
}

// Local copy of the weekday helper (client-safe, no imports needed server-side).
function weekdayOf(dateISO: string): string {
  const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const d = new Date(`${dateISO}T00:00:00Z`);
  return WEEKDAYS[d.getUTCDay()];
}
