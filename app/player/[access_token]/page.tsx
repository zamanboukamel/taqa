import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DayCard } from "@/app/player/meal-card";
import { RamadanPlan } from "@/app/player/ramadan-plan";
import { Mark } from "@/components/ui/brand";
import { Stagger, StaggerItem, PowerBar } from "@/components/ui/motion";
import { CountUp } from "@/components/ui/count-up";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary, localizeSport } from "@/lib/i18n/dictionaries";
import { isRamadanPlan, type Academy, type MealPlan, type Player } from "@/lib/types";

// This page is PUBLIC — no login. A player opens it with their secret link.
// It uses the service-role client (bypasses RLS) and finds the player ONLY by
// their unguessable access_token, so no other player's data is reachable.
// Always read fresh from the DB so a regenerated plan shows up immediately.
export const dynamic = "force-dynamic";

export default async function PlayerPlanPage(
  props: PageProps<"/player/[access_token]">,
) {
  const { access_token } = await props.params;

  const locale = await getLocale();
  const t = getDictionary(locale);

  const supabase = createAdminClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("access_token", access_token)
    .maybeSingle<Player>();

  // Unknown/invalid token: show the standard 404, never reveal whether the
  // token "exists but has no plan" vs "doesn't exist".
  if (!player) notFound();

  const [{ data: mealPlan }, { data: academy }] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("player_id", player.id)
      .maybeSingle<MealPlan>(),
    supabase
      .from("academies")
      .select("*")
      .eq("id", player.academy_id)
      .maybeSingle<Academy>(),
  ]);

  // Discriminate the plan shape: a Ramadan plan is rendered as a fasting-day
  // timeline; a standard plan keeps its original meal-card layout untouched.
  const plan = mealPlan?.plan_json ?? null;
  const ramadan = plan && isRamadanPlan(plan) ? plan : null;
  const standard = plan && !isRamadanPlan(plan) ? plan : null;

  // Render Sunday-first (GCC week), regardless of the order the plan was
  // generated in — so existing Monday-first plans display correctly too.
  const DAY_ORDER = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const standardDays = [...(standard?.days ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
  );

  // Header stats read the same common fields on either plan shape.
  const allDays = ramadan?.days ?? standard?.days ?? [];
  const trainingDays = allDays.filter((d) => d.label === "Training Day").length;
  const avgCalories = allDays.length
    ? Math.round(
        allDays.reduce((sum, d) => sum + d.estimated_calories, 0) /
          allDays.length,
      )
    : 0;
  const hasPlan = allDays.length > 0;

  return (
    <main className="min-h-screen bg-bone text-ink">
      {/* ── Athlete profile header ──────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-midnight px-5 pb-12 pt-7 text-white">
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-40" />
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 charge-glow" />

        <div className="relative mx-auto max-w-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mark className="h-6 w-6" />
              <span className="inline-flex items-baseline gap-1.5">
                <span className="font-display text-lg font-semibold">Taqa</span>
                <span
                  lang="ar"
                  dir="rtl"
                  className="translate-y-[0.12em] leading-none text-charge/90"
                >
                  طاقة
                </span>
              </span>
            </div>
            <LanguageToggle />
          </div>

          <div className="mt-7 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-volt to-charge font-display text-xl font-bold text-midnight">
              {initials(player.name)}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-semibold leading-tight">
                {player.name}
              </h1>
              <p className="text-sm text-mist">
                {academy?.name}
                {academy?.sport_type
                  ? ` · ${localizeSport(academy.sport_type, t)}`
                  : ""}
                {player.position ? ` · ${player.position}` : ""}
              </p>
            </div>
          </div>

          {hasPlan && (
            <>
              {ramadan && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-charge/15 px-3 py-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-volt ring-1 ring-charge/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-volt" />
                  {t.ramadan.modeBadge}
                </span>
              )}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <HeaderStat
                  value={<CountUp value={avgCalories} />}
                  label={t.player.avgKcal}
                />
                <HeaderStat value={trainingDays} label={t.player.trainingDays} />
                <HeaderStat
                  value={7 - trainingDays}
                  label={t.player.restDays}
                />
              </div>
              <div className="mt-5">
                <PowerBar segments={14} />
              </div>
              {ramadan && (
                <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldIcon />
                    <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-300">
                      {t.ramadan.safetyTitle}
                    </p>
                  </div>
                  <p className="mt-1.5 text-[0.85rem] font-medium leading-snug text-amber-100/90">
                    {ramadan.safety_note}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Plan ────────────────────────────────────────────────────────── */}
      <div className="mx-auto -mt-6 max-w-md px-4 pb-2">
        {!hasPlan ? (
          <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-[0_14px_44px_-18px_rgba(11,20,16,0.35)] ring-1 ring-black/5">
            <p className="text-lg font-bold text-ink">{t.player.noPlanTitle}</p>
            <p className="mt-1.5 text-base text-slate-600">
              {t.player.noPlanBody}
            </p>
          </div>
        ) : ramadan ? (
          <RamadanPlan plan={ramadan} t={t} />
        ) : (
          <Stagger className="space-y-4" gap={0.08}>
            {standardDays.map((day) => (
              <StaggerItem key={day.day}>
                <DayCard
                  day={day}
                  dayName={t.days[day.day as keyof typeof t.days] ?? day.day}
                  labels={t.mealCard}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-md px-5 pb-10 pt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <Mark className="h-5 w-5" />
          {t.player.footer}
        </div>
      </footer>
    </main>
  );
}

function HeaderStat({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-pitch-line bg-white/5 px-3 py-2.5 text-center backdrop-blur">
      <p className="tabular text-xl font-bold text-white">{value}</p>
      <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-mist">
        {label}
      </p>
    </div>
  );
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"
        stroke="#fbbf24"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#fbbf24"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
