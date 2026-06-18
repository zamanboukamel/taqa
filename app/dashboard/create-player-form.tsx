"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none focus:border-slate-900";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Add a player</h2>
      <p className="mt-1 text-sm text-slate-600">
        Add as many players as you like. Each one gets their own meal plan.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="p-name" className="block text-sm font-medium text-slate-800">
            Name
          </label>
          <input
            id="p-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-age" className="block text-sm font-medium text-slate-800">
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
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="p-weight"
              className="block text-sm font-medium text-slate-800"
            >
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
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="p-position"
            className="block text-sm font-medium text-slate-800"
          >
            Position
          </label>
          <input
            id="p-position"
            type="text"
            required
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Midfielder"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="p-dietary"
            className="block text-sm font-medium text-slate-800"
          >
            Dietary restrictions
          </label>
          <textarea
            id="p-dietary"
            rows={2}
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="e.g. Vegetarian, no nuts. Leave blank if none."
            className={inputClass}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        {savedName && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Added {savedName}. Add another below if you like.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Add player"}
        </button>
      </form>
    </section>
  );
}
