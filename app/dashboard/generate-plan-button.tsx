"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GeneratePlanButton({
  playerId,
  hasPlan,
}: {
  playerId: string;
  hasPlan: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={generate}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? "Generating…"
          : hasPlan
            ? "Regenerate meal plan"
            : "Generate meal plan"}
      </button>

      {loading && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-amber-800">
            Generating your plan… this can take 10–20 seconds.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
