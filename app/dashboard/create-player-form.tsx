"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/brand";

export default function CreatePlayerForm({ academyId }: { academyId: string }) {
  const router = useRouter();
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
      setError(err instanceof Error ? err.message : "Could not save player.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tq-card p-6">
      <h2 className="font-display text-2xl font-semibold text-white">
        Add a player
      </h2>
      <p className="mt-1 text-sm text-mist">
        Add as many athletes as you like. Each one gets their own plan.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="p-name" className="tq-label">
            Name
          </label>
          <input
            id="p-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="tq-field"
            placeholder="Full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-age" className="tq-label">
              Age
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
              Weight (kg)
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
            Position
          </label>
          <input
            id="p-position"
            type="text"
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Midfielder"
            className="tq-field"
          />
        </div>

        <div>
          <label htmlFor="p-dietary" className="tq-label">
            Dietary restrictions
          </label>
          <textarea
            id="p-dietary"
            rows={2}
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, no nuts. Leave blank if none."
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
            Added {savedName}. Add another below if you like.
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
            "Add player"
          )}
        </button>
      </form>
    </div>
  );
}
