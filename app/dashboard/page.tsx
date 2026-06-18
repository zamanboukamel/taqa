import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Academy, TrainingSchedule, Player } from "@/lib/types";
import LogoutButton from "./logout-button";
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
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Taqa Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-6">
        {!academy ? (
          <CreateAcademyForm ownerId={user.id} />
        ) : (
          <>
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Academy</p>
              <p className="text-xl font-bold text-slate-900">{academy.name}</p>
              <p className="text-sm text-slate-600">{academy.sport_type}</p>
            </section>

            <ScheduleManager academyId={academy.id} schedules={schedules} />

            <section>
              <h2 className="mb-2 px-1 text-lg font-bold text-slate-900">
                Players{players.length > 0 ? ` (${players.length})` : ""}
              </h2>

              {players.length === 0 ? (
                <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                  No players yet. Add your first one below.
                </p>
              ) : (
                <ul className="space-y-4">
                  {players.map((player) => {
                    const hasPlan = plannedIds.has(player.id);
                    return (
                      <li
                        key={player.id}
                        className="rounded-2xl bg-white p-6 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xl font-bold text-slate-900">
                            {player.name}
                          </p>
                          {hasPlan && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              Plan ready
                            </span>
                          )}
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-slate-700">
                          <dt className="text-slate-500">Age</dt>
                          <dd>{player.age ?? "—"}</dd>
                          <dt className="text-slate-500">Weight</dt>
                          <dd>
                            {player.weight_kg ? `${player.weight_kg} kg` : "—"}
                          </dd>
                          <dt className="text-slate-500">Position</dt>
                          <dd>{player.position || "—"}</dd>
                          <dt className="text-slate-500">Dietary</dt>
                          <dd>{player.dietary_restrictions || "None"}</dd>
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
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <CreatePlayerForm academyId={academy.id} />
          </>
        )}
      </div>
    </main>
  );
}
