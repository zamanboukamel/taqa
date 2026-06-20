import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Academy, TrainingSchedule, Player } from "@/lib/types";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import DashboardShell from "./dashboard-shell";
import CreateAcademyForm from "./create-academy-form";
import ScheduleManager from "./schedule-manager";
import CreatePlayerForm from "./create-player-form";
import GeneratePlanButton from "./generate-plan-button";
import ShareLink from "./share-link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  if (academy) {
    const { data: sched } = await supabase
      .from("training_schedules")
      .select("*")
      .eq("academy_id", academy.id);
    schedules = sched ?? [];

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
          <p className="eyebrow">Get started</p>
          <h1 className="font-display mt-2 mb-6 text-3xl font-semibold text-white">
            Set up your academy
          </h1>
          <CreateAcademyForm ownerId={user.id} />
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Overview ─────────────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-20">
            <p className="eyebrow">{academy.sport_type}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold text-white">
              {academy.name}
            </h1>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Players" value={players.length} />
              <StatCard label="Plans ready" value={plannedIds.size} accent />
              <StatCard
                label="Awaiting plan"
                value={players.length - plannedIds.size}
              />
              <StatCard label="Training days" value={schedules.length} />
            </div>
          </section>

          {/* ── Schedule ─────────────────────────────────────────────── */}
          <section id="schedule" className="scroll-mt-20">
            <ScheduleManager academyId={academy.id} schedules={schedules} />
          </section>

          {/* ── Players ──────────────────────────────────────────────── */}
          <section id="players" className="scroll-mt-20">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold text-white">
                Players
              </h2>
              {players.length > 0 && (
                <span className="font-mono text-sm text-mist">
                  {plannedIds.size}/{players.length} fuelled
                </span>
              )}
            </div>

            {players.length === 0 ? (
              <div className="tq-card px-6 py-12 text-center">
                <p className="text-base font-semibold text-white">
                  No players yet
                </p>
                <p className="mt-1 text-sm text-mist">
                  Add your first athlete below to generate a plan.
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
                          <StatusBadge ready={hasPlan} />
                        </div>

                        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <Stat label="Age" value={player.age ?? "—"} />
                          <Stat
                            label="Weight"
                            value={
                              player.weight_kg ? `${player.weight_kg}kg` : "—"
                            }
                          />
                          <Stat
                            label="Diet"
                            value={player.dietary_restrictions ? "Custom" : "None"}
                          />
                        </dl>

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

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-charge/15 px-2.5 py-1 text-xs font-semibold text-volt">
      <span className="h-1.5 w-1.5 rounded-full bg-volt" />
      Plan ready
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-mist">
      <span className="h-1.5 w-1.5 rounded-full bg-mist-2" />
      No plan
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
