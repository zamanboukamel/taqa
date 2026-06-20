# Taqa — Design Guide

The brand is built on one idea: **Taqa (طاقة) means "energy."** Everything —
palette, motion, the signature counter — is about *fuel, charge, and the work*.

Keep new UI on-brand by reusing the tokens and components below rather than
inventing one-off styles.

## Two contexts, one identity

| Surface | Audience / context | Look |
|---|---|---|
| Home `/`, Login, Dashboard | Director, indoors, on a laptop | **Dark "command center"** — Midnight base, Pitch cards, emerald actions |
| Player `/player/[token]` | Athlete, **outdoors, in sunlight** | **Daylight** — bone page, white high-contrast cards |

⚠️ **The player meal-plan view must stay light and high-contrast** so it reads
in direct sunlight. Card *bodies* are always white with near-black text. Only
the card *headers* and the profile band use saturated/dark color.

## Color tokens

Defined in `app/globals.css` under `@theme`, available as Tailwind utilities
(`bg-midnight`, `text-charge`, `border-pitch-line`, …).

| Token | Hex | Use |
|---|---|---|
| `midnight` / `midnight-2` | `#0b1410` / `#0e1a14` | Dark base |
| `pitch` / `pitch-line` | `#0f1d17` / `#1c2e25` | Dark cards / borders |
| `charge` | `#10b981` | Primary brand + actions |
| `volt` | `#34d399` | Bright highlight / glow |
| `fuel` / `fuel-deep` | `#f6b25a` / `#e8913a` | Warm energy spark — the **Generate** action, calorie tips. Use sparingly. |
| `bone` | `#f5f6f3` | Player page background |
| `ink` | `#0b1410` | Text on light |
| `mist` / `mist-2` | `#93a39a` / `#5e6f66` | Muted text on dark |

## Type roles

Wired in `app/layout.tsx` via `next/font`.

- **Display — Fraunces** (variable serif). Headlines only. Apply `font-display`.
- **Body / UI — Geist Sans** (default `body` font).
- **Data — Geist Mono.** Calories, stats, eyebrows. Use `.tabular` for numbers
  so widths don't jump while counting.

Helper classes: `.eyebrow` (mono, spaced, emerald label), `.tabular`.

## Components (`components/ui/`)

- `brand.tsx` — `<Mark>` (logomark), `<Wordmark>` (bilingual lockup),
  `<Spinner>` (the branded "charging ring" — use for **all** loading states).
- `motion.tsx` — `<Reveal>` (scroll fade-up), `<Stagger>` + `<StaggerItem>`
  (sequenced entrance), `<PowerBar>` (the signature segmented energy bar).
- `count-up.tsx` — `<CountUp value={n} />` the calorie counter that charges
  from 0 when scrolled into view.

## CSS component classes (`globals.css`)

- Buttons: `.tq-btn` + one of `.tq-btn-primary` (emerald, default action),
  `.tq-btn-fuel` (amber, the power action — Generate), `.tq-btn-ghost`.
- Cards on dark: `.tq-card`.
- Forms on dark: `.tq-label`, `.tq-field`.
- Status: `.tq-alert-error`, `.tq-alert-ok`.
- Texture: `.turf-grid`, `.charge-glow`. Loading shimmer: `.tq-shimmer`.

## Motion rules

- Built on **Framer Motion** (`motion` package, imported from `motion/react`).
- Interactions are snappy (≤300ms); entrances are 0.5–0.6s; the hero ~1s.
- Buttons: hover lifts + intensifies glow (CSS), press scales to 0.97.
- **Every** animation respects `prefers-reduced-motion`: the motion components
  short-circuit to static, and `globals.css` neutralizes CSS animations under
  the reduce media query. Don't add raw keyframe animations without that guard.

## Accessibility floor

- Body text on light is near-black (`ink`) on white — well above 4.5:1.
- Focus is always visible (`*:focus-visible` → volt outline). Don't remove it.
- All decorative SVGs carry `aria-hidden`; the spinner exposes `role="status"`.

## Signature — "The Charge"

The one thing to keep memorable: calories **count up** into a badge, the
**PowerBar** segments light up in sequence, and the **fuel** color marks the
single most important action on a screen. Spend boldness there; keep the rest
quiet.
