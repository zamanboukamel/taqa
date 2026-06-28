"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/language-provider";

// Shows the player's public meal-plan link with a one-tap copy button.
// The full URL is computed on the server and passed in as a prop, so the
// server and client render identical HTML (no hydration mismatch).
export default function ShareLink({ url }: { url: string }) {
  const { t } = useI18n();
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
    <div className="mt-3 rounded-xl border border-pitch-line bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-charge">
          {t.share.playerLink}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-mist transition-colors hover:text-white"
        >
          {t.share.open}
        </a>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-midnight px-2.5 py-2 text-xs text-mist">
          {url}
        </code>
        <button
          onClick={copy}
          className={`tq-btn shrink-0 !px-3 !py-2 text-xs transition-colors ${
            copied ? "tq-btn-primary" : "tq-btn-ghost"
          }`}
        >
          {copied ? (
            <>
              <Check />
              {t.share.copied}
            </>
          ) : (
            t.share.copy
          )}
        </button>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
