"use client";

// A small on/off switch styled to the brand. Charge-green when on.
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2.5 ${
        disabled ? "opacity-50" : "cursor-pointer"
      }`}
    >
      {label && (
        <span className="text-sm font-semibold text-white">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked
            ? "bg-gradient-to-r from-volt to-charge"
            : "bg-pitch-line"
        }`}
      >
        <span
          className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-[1.45rem]" : "translate-x-[0.2rem]"
          }`}
          style={{ height: "1.05rem", width: "1.05rem" }}
        />
      </button>
    </label>
  );
}
