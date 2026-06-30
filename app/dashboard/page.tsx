import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Academy,
  TrainingSchedule,
  Player,
  RamadanDayTimes,
} from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary, localizeSport } from "@/lib/i18n/dictionaries";
import DashboardShell from "./dashboard-shell";
import CreateAcademyForm from "./create-academy-form";
import ScheduleManager from "./schedule-manager";
import CreatePlayerForm from "./create-player-form";
import GeneratePlanButton from "./generate-plan-button";
import ShareLink from "./share-link";
import RamadanSettings from "./ramadan-settings";
import PlayerRamadanControls from "./player-ramadan-controls";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const t = getDictionary(locale);

  // Build the public origin server-side so the player link is absolute and
  // identical on server and client (no hydration mismatch in ShareLink).
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";

  // One academy per director (RLS scopes this to academies they own).
  const { data: academies } = await supabase
    .from("academies")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  const academy: Academy | null = academies?.[0] ?? null;

  let schedules: TrainingSchedule[] = [];
  let players: Player[] = [];
  let plannedIds = new Set<string>();
  let ramadanTimes: RamadanDayTimes[] = [];

  if (academy) {
    const { data: sched } = await supabase
      .from("training_schedules")
      .select("*")
      .eq("academy_id", academy.id);
    schedules = sched ?? [];

    const { data: times } = await supabase
      .from("ramadan_days")
      .select("*")
      .eq("academy_id", academy.id);
    ramadanTimes = times ?? [];

    const { data: playerRows } = await supabase
      .from("players")
      .select("*")
      .eq("academy_id", academy.id)
      .order("created_at", { ascending: true });
    players = playerRows ?? [];

    if (players.length > 0) {
      const { data: plans } = await supabase
        .from("meal_plans")
        .select("player_id")
        .in(
          "player_id",
          players.map((p) => p.id),
        );
      plannedIds = new Set((plans ?? []).map((p) => p.player_id as string));
    }
  }

  return (
    <DashboardShell email={user.email ?? ""}>
      {!academy ? (
        <div className="mx-auto max-w-md py-6">
          <p className="eyebrow">{t.dashboard.getStarted}</p>
          <h1 className="font-display mt-2 mb-6 text-3xl font-semibold text-white">
            {t.dashboard.setUpAcademy}
          </h1>
          <CreateAcademyForm ownerId={user.id} />
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Overview ─────────────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-20">
            <p className="eyebrow">{localizeSport(academy.sport_type, t)}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-white">
              {academy.name}
            </h1>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label={t.dashboard.players} value={players.length} />
              <StatCard
                label={t.dashboard.plansReady}
                value={plannedIds.size}
                accent
              />
              <StatCard
                label={t.dashboard.awaitingPlan}
                value={players.length - plannedIds.size}
              />
              <StatCard
                label={t.dashboard.trainingDays}
                value={schedules.length}
              />
            </div>
          </section>

          {/* ── Schedule ─────────────────────────────────────────────── */}
          <section id="schedule" className="scroll-mt-20">
            <ScheduleManager academyId={academy.id} schedules={schedules} />
          </section>

          {/* ── Ramadan Mode ─────────────────────────────────────────── */}
          <section id="ramadan" className="scroll-mt-20">
            <RamadanSettings
              academyId={academy.id}
              initialMode={academy.ramadan_mode}
              initialCity={academy.city}
              initialCountry={academy.country}
              initialStartDate={academy.ramadan_start_date}
              initialTimes={ramadanTimes}
            />
          </section>

          {/* ── Players ──────────────────────────────────────────────── */}
          <section id="players" className="scroll-mt-20">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold text-white">
                {t.dashboard.players}
              </h2>
              {players.length > 0 && (
                <span className="font-mono text-sm text-mist">
                  {plannedIds.size}/{players.length} {t.dashboard.fuelled}
                </span>
              )}
            </div>

            {players.length === 0 ? (
              <div className="tq-card px-6 py-12 text-center">
                <p className="text-base font-semibold text-white">
                  {t.dashboard.noPlayersYet}
                </p>
                <p className="mt-1 text-sm text-mist">
                  {t.dashboard.addFirstAthlete}
                </p>
              </div>
            ) : (
              <Stagger className="grid gap-4 md:grid-cols-2">
                {players.map((player) => {
                  const hasPlan = plannedIds.has(player.id);
                  return (
                    <StaggerItem key={player.id}>
                      <article className="tq-card group h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-charge/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-charge/15 font-mono text-sm font-semibold text-charge">
                              {initials(player.name)}
                            </span>
                            <div>
                              <p className="text-lg font-semibold leading-tight text-white">
                                {player.name}
                              </p>
                              <p className="text-xs text-mist">
                                {player.position || "—"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge
                            ready={hasPlan}
                            readyLabel={t.dashboard.planReady}
                            noPlanLabel={t.dashboard.noPlan}
                          />
                        </div>

                        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <Stat
                            label={t.dashboard.statAge}
                            value={player.age ?? "—"}
                          />
                          <Stat
                            label={t.dashboard.statWeight}
                            value={
                              player.weight_kg ? `${player.weight_kg}kg` : "—"
                            }
                          />
                          <Stat
                            label={t.dashboard.statDiet}
                            value={
                              player.dietary_restrictions
                                ? t.dashboard.dietCustom
                                : t.dashboard.dietNone
                            }
                          />
                        </dl>

                        <PlayerRamadanControls
                          playerId={player.id}
                          initialOverride={player.ramadan_mode}
                          initialFasting={player.is_fasting}
                          initialTrainingTime={player.training_time}
                        />

                        <GeneratePlanButton
                          playerId={player.id}
                          hasPlan={hasPlan}
                        />

                        {hasPlan && (
                          <ShareLink
                            url={`${origin}/player/${player.access_token}`}
                          />
                        )}
                      </article>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </section>

          {/* ── Add player ───────────────────────────────────────────── */}
          <section id="add-player" className="scroll-mt-20">
            <CreatePlayerForm academyId={academy.id} />
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="tq-card p-4">
      <p
        className={`font-display text-3xl font-semibold ${
          accent ? "text-charge" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-mist">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/20 py-2">
      <p className="font-mono text-sm font-semibold text-white">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-wide text-mist-2">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({
  ready,
  readyLabel,
  noPlanLabel,
}: {
  ready: boolean;
  readyLabel: string;
  noPlanLabel: string;
}) {
  return ready ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-charge/15 px-2.5 py-1 text-xs font-semibold text-volt">
      <span className="h-1.5 w-1.5 rounded-full bg-volt" />
      {readyLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-mist">
      <span className="h-1.5 w-1.5 rounded-full bg-mist-2" />
      {noPlanLabel}
    </span>
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
