import type { CSSProperties } from "react";

/**
 * Mark — the Taqa logomark: a charge bolt set in a rounded "pitch" tile.
 * Energy made literal. Pure SVG, no dependency.
 */
export function Mark({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="tq-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tq-mark)" />
      <path
        d="M17.8 5.5 L8.6 18.2 H14.4 L13.2 26.5 L23.4 12.6 H17.1 Z"
        fill="#0b1410"
      />
    </svg>
  );
}

/**
 * Wordmark — bilingual brand lockup. The Arabic طاقة ("energy") is the
 * point of difference: this is a GCC product, not a Western-SaaS clone.
 */
export function Wordmark({
  withArabic = true,
  className,
  markClassName = "h-7 w-7",
}: {
  withArabic?: boolean;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Mark className={markClassName} />
      <span className="inline-flex items-baseline gap-2">
        <span className="font-display text-xl font-semibold tracking-tight text-white">
          Taqa
        </span>
        {withArabic && (
          // Arabic rests high above the baseline; nudge it down to sit level.
          <span
            lang="ar"
            dir="rtl"
            className="translate-y-[0.12em] text-lg font-medium leading-none text-charge/90"
          >
            طاقة
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Spinner — a branded "charging ring" used for all loading states.
 */
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-[tq-spin_0.7s_linear_infinite] rounded-full border-2 border-charge/25 border-t-charge ${className}`}
    />
  );
}
