"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateAcademyForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Create your academy</h2>
      <p className="mt-1 text-sm text-slate-600">
        You haven&apos;t set up an academy yet. Add it to get started.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="academy-name"
            className="block text-sm font-medium text-slate-800"
          >
            Academy name
          </label>
          <input
            id="academy-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riverside Football Academy"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="sport-type"
            className="block text-sm font-medium text-slate-800"
          >
            Sport
          </label>
          <input
            id="sport-type"
            type="text"
            required
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            placeholder="e.g. Football"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none focus:border-slate-900"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Create academy"}
        </button>
      </form>
    </section>
  );
}
