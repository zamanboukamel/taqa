"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import { Toggle } from "@/components/ui/toggle";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/components/i18n/language-provider";

// Per-player Ramadan overrides, shown as a small disclosure inside each player
// card. Edits players.ramadan_mode / is_fasting / training_time directly (RLS
// scopes writes to the director's own academy).
export default function PlayerRamadanControls({
  playerId,
  initialOverride,
  initialFasting,
}: {
  playerId: string;
  initialOverride: boolean | null;
  initialFasting: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  // 3-state override: inherit academy default / force on / force off.
  const OPTIONS = [t.ramadan.inherit, t.ramadan.on, t.ramadan.off];
  const overrideToLabel = (v: boolean | null) =>
    v == null ? t.ramadan.inherit : v ? t.ramadan.on : t.ramadan.off;
  const labelToOverride = (l: string): boolean | null =>
    l === t.ramadan.on ? true : l === t.ramadan.off ? false : null;

  const [override, setOverride] = useState(overrideToLabel(initialOverride));
  const [fasting, setFasting] = useState(initialFasting);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("players")
        .update({
          ramadan_mode: labelToOverride(override),
          is_fasting: fasting,
        })
        .eq("id", playerId);
      if (error) throw error;
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ramadan.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 border-t border-pitch-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-mist transition-colors hover:text-charge"
      >
        <span className="inline-flex items-center gap-1.5">
          <MoonIcon />
          {t.ramadan.playerTitle}
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <Chevron />
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="tq-label">{t.ramadan.overrideLabel}</label>
            <Select value={override} onChange={setOverride} options={OPTIONS} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-pitch-line bg-black/20 px-3 py-2.5">
            <span className="text-sm text-white">{t.ramadan.fastingLabel}</span>
            <Toggle checked={fasting} onChange={setFasting} />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className={`tq-btn w-full py-2.5 text-sm ${
              saved ? "tq-btn-primary" : "tq-btn-ghost"
            }`}
          >
            {saving ? (
              <>
                <Spinner className="h-4 w-4" />
                {t.common.saving}
              </>
            ) : saved ? (
              t.ramadan.saved
            ) : (
              t.ramadan.save
            )}
          </button>

          {error && (
            <p role="alert" className="tq-alert-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 10.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
