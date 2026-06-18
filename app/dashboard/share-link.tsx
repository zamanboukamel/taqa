"use client";

import { useState } from "react";

// Shows the player's public meal-plan link with a one-tap copy button.
// The full URL is computed on the server and passed in as a prop, so the
// server and client render identical HTML (no hydration mismatch).
export default function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); leave the link
      // visible so the director can copy it by hand.
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Player link
      </p>
      <div className="mt-1 flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-700 underline"
        >
          {url}
        </a>
        <button
          onClick={copy}
          className="shrink-0 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
