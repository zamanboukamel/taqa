"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/brand";

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
    <div className="mt-4">
      <button
        onClick={generate}
        disabled={loading}
        className={`tq-btn w-full py-3 ${
          hasPlan ? "tq-btn-ghost" : "tq-btn-fuel"
        }`}
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4" />
            Generating…
          </>
        ) : hasPlan ? (
          "Regenerate plan"
        ) : (
          <>
            <Bolt />
            Generate meal plan
          </>
        )}
      </button>

      {loading && (
        <div className="mt-3 overflow-hidden rounded-xl border border-pitch-line bg-black/20 px-4 py-3">
          <p className="text-sm font-medium text-fuel">
            Building a training-aware week…
          </p>
          <p className="mt-0.5 text-xs text-mist">
            This usually takes 10–20 seconds.
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-pitch-line">
            <div className="tq-shimmer h-full w-full" />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="tq-alert-error mt-3">
          {error}
        </p>
      )}
    </div>
  );
}

function Bolt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
