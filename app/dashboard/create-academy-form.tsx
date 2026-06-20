"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";
import { Select } from "@/components/ui/select";

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
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [customSport, setCustomSport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Resolve the final sport: the "Other…" option uses the free-text value.
    const sportType = sport === "Other…" ? customSport.trim() : sport;
    if (!sportType) {
      setError("Please choose a sport.");
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
      setError(err instanceof Error ? err.message : "Could not save academy.");
      setLoading(false);
    }
  }

  return (
    <div className="tq-card p-6">
      <h2 className="font-display text-xl font-semibold text-white">
        Create your academy
      </h2>
      <p className="mt-1 text-sm text-mist">
        You haven&apos;t set up an academy yet. Add it to get started.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="academy-name" className="tq-label">
            Academy name
          </label>
          <input
            id="academy-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverside Football Academy"
            className="tq-field"
          />
        </div>

        <div>
          <label htmlFor="sport-type" className="tq-label">
            Sport
          </label>
          <Select
            id="sport-type"
            value={sport}
            onChange={setSport}
            placeholder="Choose a sport…"
            options={[...SPORTS, "Other…"]}
          />

          {sport === "Other…" && (
            <input
              type="text"
              required
              value={customSport}
              onChange={(e) => setCustomSport(e.target.value)}
              placeholder="Enter your sport"
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
              Saving…
            </>
          ) : (
            "Create academy"
          )}
        </button>
      </form>
    </div>
  );
}
