import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { DayCard } from "@/app/player/meal-card";
import { Mark } from "@/components/ui/brand";
import { Stagger, StaggerItem, PowerBar } from "@/components/ui/motion";
import { CountUp } from "@/components/ui/count-up";
import type { Academy, MealPlan, Player } from "@/lib/types";

// This page is PUBLIC — no login. A player opens it with their secret link.
// It uses the service-role client (bypasses RLS) and finds the player ONLY by
// their unguessable access_token, so no other player's data is reachable.
// Always read fresh from the DB so a regenerated plan shows up immediately.
export const dynamic = "force-dynamic";

export default async function PlayerPlanPage(
  props: PageProps<"/player/[access_token]">,
) {
  const { access_token } = await props.params;

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

  const days = mealPlan?.plan_json?.days ?? [];
  const trainingDays = days.filter((d) => d.label === "Training Day").length;
  const avgCalories = days.length
    ? Math.round(
        days.reduce((sum, d) => sum + d.estimated_calories, 0) / days.length,
      )
    : 0;

  return (
    <main className="min-h-screen bg-bone text-ink">
      {/* ── Athlete profile header ──────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-midnight px-5 pb-12 pt-7 text-white">
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-40" />
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 charge-glow" />

        <div className="relative mx-auto max-w-md">
          <div className="flex items-center gap-2">
            <Mark className="h-6 w-6" />
            <span className="inline-flex items-baseline gap-1.5">
              <span className="font-display text-lg font-semibold">Taqa</span>
              <span
                lang="ar"
                dir="rtl"
                className="leading-none text-charge/90"
              >
                طاقة
              </span>
            </span>
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
                {academy?.sport_type ? ` · ${academy.sport_type}` : ""}
                {player.position ? ` · ${player.position}` : ""}
              </p>
            </div>
          </div>

          {days.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <HeaderStat
                  value={<CountUp value={avgCalories} />}
                  label="avg kcal"
                />
                <HeaderStat value={trainingDays} label="training days" />
                <HeaderStat value={7 - trainingDays} label="rest days" />
              </div>
              <div className="mt-5">
                <PowerBar segments={14} />
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Plan ────────────────────────────────────────────────────────── */}
      <div className="mx-auto -mt-6 max-w-md px-4 pb-2">
        {days.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-12 text-center shadow-[0_14px_44px_-18px_rgba(11,20,16,0.35)] ring-1 ring-black/5">
            <p className="text-lg font-bold text-ink">No plan yet</p>
            <p className="mt-1.5 text-base text-slate-600">
              Your meal plan hasn&apos;t been created yet. Please check back
              soon.
            </p>
          </div>
        ) : (
          <Stagger className="space-y-4" gap={0.08}>
            {days.map((day) => (
              <StaggerItem key={day.day}>
                <DayCard day={day} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-md px-5 pb-10 pt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-500">
          <Mark className="h-5 w-5" />
          Generated by Taqa · Eat for your training
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
