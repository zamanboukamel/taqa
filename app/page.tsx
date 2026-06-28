import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Reveal, Stagger, StaggerItem, PowerBar } from "@/components/ui/motion";
import { Mark, Wordmark } from "@/components/ui/brand";
import { HeroShowcase } from "@/components/ui/hero-showcase";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";

// The marketing landing — the first thing a visiting director sees.
// Public; we only peek at the session to swap the nav CTA.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authed = Boolean(user);

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="relative overflow-hidden bg-midnight text-white">
      {/* Ambient turf grid + charge glow behind everything */}
      <div className="pointer-events-none absolute inset-0 turf-grid opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 charge-glow" />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark />
        <div className="flex items-center gap-2.5">
          <LanguageToggle />
          <Link
            href={authed ? "/dashboard" : "/login"}
            className="tq-btn tq-btn-ghost !px-4 !py-2 text-sm"
          >
            {authed ? t.common.openDashboard : t.common.signIn}
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-2 lg:gap-8 lg:pt-16">
        <Reveal>
          <p className="eyebrow">{t.home.heroEyebrow}</p>
          <h1 className="font-display mt-5 text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            {t.home.heroTitleA}
            <br />
            {t.home.heroTitleB}&nbsp;
            <span className="bg-gradient-to-r from-volt to-fuel bg-clip-text text-transparent">
              {t.home.heroTitleHighlight}
            </span>
            {locale === "en" ? "." : ""}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-mist">
            {t.home.heroBody}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="relative inline-flex rounded-xl">
              <span className="absolute inset-0 rounded-xl animate-pulse-ring" />
              <Link
                href={authed ? "/dashboard" : "/login"}
                className="tq-btn tq-btn-primary relative px-6 py-3.5 text-base"
              >
                {authed ? t.common.openDashboard : t.common.startFree}
                <Arrow />
              </Link>
            </span>
            <a href="#how" className="tq-btn tq-btn-ghost px-5 py-3.5 text-base">
              {t.common.howItWorks}
            </a>
          </div>

          <div className="mt-8 max-w-xs">
            <PowerBar segments={16} />
            <p className="mt-2.5 font-mono text-xs uppercase tracking-widest text-mist-2">
              {t.home.powerBarCaption}
            </p>
          </div>
        </Reveal>

        {/* Hero showpiece — a card that auto-generates the whole week in
            front of you (gradient morph, calorie tween, meals swap), and
            tilts in 3D toward the cursor. The one bold moment. */}
        <Reveal delay={0.15} className="relative [perspective:1200px]">
          <HeroShowcase />
        </Reveal>
      </section>

      {/* ── Stat strip ──────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-pitch-line bg-midnight-2/60">
        <Stagger className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-pitch-line px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {t.home.stats.map((s) => (
            <StaggerItem
              key={s.big}
              className="px-2 py-7 text-center sm:py-9"
            >
              <p className="font-display text-4xl font-semibold text-white">
                {s.big}
              </p>
              <p className="mt-1.5 text-sm text-mist">{s.small}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Value props ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <Reveal>
          <p className="eyebrow">{t.home.whyEyebrow}</p>
          <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            {t.home.whyTitle}
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.features.map((f, i) => (
            <StaggerItem key={f.title}>
              <article className="tq-card group h-full p-6 transition-colors duration-300 hover:border-charge/60">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-charge/12 text-charge transition-transform duration-300 group-hover:scale-110">
                  {FEATURE_ICONS[i]}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {f.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section
        id="how"
        className="relative z-10 border-y border-pitch-line bg-midnight-2/40"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
          <Reveal>
            <p className="eyebrow">{t.home.howEyebrow}</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
              {t.home.howTitle}
            </h2>
          </Reveal>

          <Stagger className="mt-12 grid gap-8 md:grid-cols-3">
            {t.home.steps.map((s, i) => (
              <StaggerItem key={s.title}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm text-charge">
                    {STEP_NUMBERS[i]}
                  </span>
                  <span className="h-px flex-1 bg-pitch-line" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {s.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <Reveal>
          <p className="eyebrow">{t.home.proofEyebrow}</p>
          <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
            {t.home.proofTitle}
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {t.home.quotes.map((q, i) => (
            <StaggerItem key={q.name}>
              <figure className="tq-card flex h-full flex-col p-6">
                <blockquote className="font-display text-lg leading-snug text-white/95">
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charge/15 font-mono text-sm font-semibold text-charge">
                    {QUOTE_INITIALS[i]}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-white">
                      {q.name}
                    </span>
                    <span className="text-mist">{q.role}</span>
                  </span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
        <Reveal>
          <div className="tq-card relative overflow-hidden p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute inset-0 turf-grid opacity-40" />
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[640px] -translate-x-1/2 charge-glow" />
            <div className="relative">
              <Mark className="mx-auto h-12 w-12" />
              <h2 className="font-display mx-auto mt-6 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
                {t.home.ctaTitle}
              </h2>
              <div className="mt-8 flex justify-center">
                <Link
                  href={authed ? "/dashboard" : "/login"}
                  className="tq-btn tq-btn-primary px-7 py-4 text-base"
                >
                  {authed ? t.common.openDashboard : t.common.startFree}
                  <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-pitch-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Wordmark markClassName="h-6 w-6" />
          <p className="text-sm text-mist-2">
            © {YEAR} {t.home.footerTagline}
          </p>
          <Link href="/login" className="text-sm text-mist hover:text-white">
            {t.home.footerSignin}
          </Link>
        </div>
      </footer>
    </div>
  );
}

// Year is fixed at build/render; avoids any client/server clock mismatch.
const YEAR = 2026;

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      // Flip the arrow to point the reading direction in Arabic (RTL).
      className="transition-transform rtl:-scale-x-100"
    >
      <path
        d="M3 8h9M8.5 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Visual-only data that pairs by index with the translated copy in the
// dictionary (icons, step numbers, avatar monograms).
const FEATURE_ICONS = [
  <IconUser key="u" />,
  <IconSpark key="s" />,
  <IconCalendar key="c" />,
  <IconLink key="l" />,
];

const STEP_NUMBERS = ["01", "02", "03"];

const QUOTE_INITIALS = ["YM", "SH", "KN"];

// ── Inline icons (no icon library; each is on-theme) ──────────────────────
function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 9.5h16M8 3.5v3M16 3.5v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 14.5l5-5M8 11l-2 2a3.5 3.5 0 005 5l2-2M16 13l2-2a3.5 3.5 0 00-5-5l-2 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
