"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import { useI18n } from "@/components/i18n/language-provider";

export default function CreatePlayerForm({ academyId }: { academyId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [position, setPosition] = useState("");
  const [dietary, setDietary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedName(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("players").insert({
        academy_id: academyId,
        name,
        age: age ? Number(age) : null,
        weight_kg: weight ? Number(weight) : null,
        position,
        dietary_restrictions: dietary,
      });
      if (error) throw error;
      // Clear the form so the next player can be added immediately.
      setSavedName(name);
      setName("");
      setAge("");
      setWeight("");
      setPosition("");
      setDietary("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.playerForm.couldNotSave,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tq-card p-6">
      <h2 className="font-display text-2xl font-semibold text-white">
        {t.playerForm.title}
      </h2>
      <p className="mt-1 text-sm text-mist">{t.playerForm.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="p-name" className="tq-label">
            {t.playerForm.nameLabel}
          </label>
          <input
            id="p-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tq-field"
            placeholder={t.playerForm.namePlaceholder}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-age" className="tq-label">
              {t.playerForm.ageLabel}
            </label>
            <input
              id="p-age"
              type="number"
              min={1}
              max={100}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="tq-field"
            />
          </div>
          <div>
            <label htmlFor="p-weight" className="tq-label">
              {t.playerForm.weightLabel}
            </label>
            <input
              id="p-weight"
              type="number"
              min={1}
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="tq-field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="p-position" className="tq-label">
            {t.playerForm.positionLabel}
          </label>
          <input
            id="p-position"
            type="text"
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder={t.playerForm.positionPlaceholder}
            className="tq-field"
          />
        </div>

        <div>
          <label htmlFor="p-dietary" className="tq-label">
            {t.playerForm.dietaryLabel}
          </label>
          <textarea
            id="p-dietary"
            rows={2}
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder={t.playerForm.dietaryPlaceholder}
            className="tq-field resize-none"
          />
        </div>

        {error && (
          <p role="alert" className="tq-alert-error">
            {error}
          </p>
        )}
        {savedName && (
          <p className="tq-alert-ok">
            {t.playerForm.addedPrefix} {savedName}. {t.playerForm.addedSuffix}
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
            t.playerForm.addBtn
          )}
        </button>
      </form>
    </div>
  );
}
