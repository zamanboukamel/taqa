"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/components/i18n/language-provider";

// The most popular academy sports across the GCC, plus an "Other" escape hatch.
const SPORTS = [
  "Football",
  "Padel",
  "Basketball",
  "Swimming",
  "Athletics (Track & Field)",
  "Tennis",
  "Volleyball",
  "Handball",
  "Cricket",
  "Rugby",
  "Martial Arts",
  "Cycling",
  "Equestrian",
] as const;

export default function CreateAcademyForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  // `sport` holds the localized label shown in the dropdown.
  const [sport, setSport] = useState("");
  const [customSport, setCustomSport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Localized labels for the dropdown, plus a map back to the English value we
  // store in the DB (so the AI prompt + display stay language-independent).
  const sportLabels = SPORTS.map((s) => t.sports[s]);
  const labelToEnglish = Object.fromEntries(
    SPORTS.map((s) => [t.sports[s], s as string]),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Resolve the final sport: the "Other…" option uses the free-text value;
    // a picked sport is converted from its localized label back to English.
    const isOther = sport === t.academyForm.otherSport;
    const sportType = isOther
      ? customSport.trim()
      : labelToEnglish[sport] ?? sport;
    if (!sportType) {
      setError(t.academyForm.chooseSport);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("academies")
        .insert({ owner_id: ownerId, name, sport_type: sportType });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.academyForm.couldNotSave,
      );
      setLoading(false);
    }
  }

  return (
    <div className="tq-card p-6">
      <h2 className="font-display text-xl font-semibold text-white">
        {t.academyForm.title}
      </h2>
      <p className="mt-1 text-sm text-mist">{t.academyForm.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="academy-name" className="tq-label">
            {t.academyForm.nameLabel}
          </label>
          <input
            id="academy-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.academyForm.namePlaceholder}
            className="tq-field"
          />
        </div>

        <div>
          <label htmlFor="sport-type" className="tq-label">
            {t.academyForm.sportLabel}
          </label>
          <Select
            id="sport-type"
            value={sport}
            onChange={setSport}
            placeholder={t.academyForm.sportPlaceholder}
            options={[...sportLabels, t.academyForm.otherSport]}
          />

          {sport === t.academyForm.otherSport && (
            <input
              type="text"
              required
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              placeholder={t.academyForm.otherSportPlaceholder}
              className="tq-field mt-2"
              autoFocus
            />
          )}
        </div>

        {error && (
          <p role="alert" className="tq-alert-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="tq-btn tq-btn-primary w-full py-3"
        >
          {loading ? (
            <>
              <Spinner className="h-4 w-4 !border-midnight/30 !border-t-midnight" />
              {t.common.saving}
            </>
          ) : (
            t.academyForm.createBtn
          )}
        </button>
      </form>
    </div>
  );
}
