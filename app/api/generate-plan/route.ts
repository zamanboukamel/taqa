
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type {
  MealPlanJson,
  AnyPlanJson,
  RamadanPlanJson,
  Player,
  Academy,
  TrainingSchedule,
} from "@/lib/types";
import { fetchRamadanTimes } from "@/lib/ramadan/times";
import {
  todayISO,
  windowDates,
  weekdayOf,
  computeScenario,
} from "@/lib/ramadan/schedule";
import {
  buildRamadanPrompt,
  isValidRamadanPlan,
  SAFETY_FALLBACK_EN,
  SAFETY_FALLBACK_AR,
  type RamadanDayBrief,
} from "@/lib/ramadan/generation";

// Anthropic SDK needs the Node runtime (not edge). Allow up to 60s since
// generation can take 10–20s.
export const runtime = "nodejs";
export const maxDuration = 60;

// Remove accidental ```json fences and any stray text around the JSON object.
function extractJson(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t
      .replace(/^```[a-zA-Z]*\s*/, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return t;
}

// Strict shape check so a malformed plan never reaches the player page.
function isValidPlan(obj: unknown): obj is MealPlanJson {
  if (typeof obj !== "object" || obj === null) return false;
  const days = (obj as { days?: unknown }).days;
  if (!Array.isArray(days) || days.length !== 7) return false;
  return days.every((d) => {
    if (typeof d !== "object" || d === null) return false;
    const x = d as Record<string, unknown>;
    return (
      typeof x.day === "string" &&
      (x.label === "Training Day" || x.label === "Rest Day") &&
      typeof x.breakfast === "string" &&
      typeof x.lunch === "string" &&
      typeof x.dinner === "string" &&
      typeof x.snacks === "string" &&
      typeof x.estimated_calories === "number" &&
      typeof x.focus_note === "string"
    );
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { playerId?: string; locale?: string };
    const playerId = body.playerId;
    // Which language to write the plan CONTENT in. Structural fields (day names,
    // the Training/Rest label, JSON keys) always stay English so validation,
    // sorting and styling keep working regardless of language.
    const wantArabic = body.locale === "ar";
    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId." }, { status: 400 });
    }

    // Auth + ownership: the server client honors RLS, so this only returns the
    // player if the signed-in director owns the academy it belongs to.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .maybeSingle();
    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    const { data: academy } = await supabase
      .from("academies")
      .select("*")
      .eq("id", player.academy_id)
      .maybeSingle();

    const { data: schedules } = await supabase
      .from("training_schedules")
      .select("*")
      .eq("academy_id", player.academy_id);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Server is missing ANTHROPIC_API_KEY. Check .env.local, then stop and restart `npm run dev`.",
        },
        { status: 500 },
      );
    }
    const anthropic = new Anthropic({ apiKey });

    async function callClaude(system: string, userPrompt: string): Promise<string> {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: userPrompt }],
      });
      return msg.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");
    }

    // Resolve the effective mode: a per-player override wins; otherwise the
    // academy default. Anything falsy => the unchanged standard path.
    const ramadanMode: boolean =
      player.ramadan_mode != null
        ? Boolean(player.ramadan_mode)
        : Boolean(academy?.ramadan_mode);

    let plan: AnyPlanJson | null = null;
    let lastError = "";

    if (ramadanMode && academy) {
      // ── Ramadan path ──────────────────────────────────────────────────────
      plan = await buildRamadanPlanWithRetry({
        supabase,
        anthropic: { call: callClaude },
        player,
        academy,
        schedules: schedules ?? [],
        wantArabic,
        onError: (m) => (lastError = m),
      });
    } else {
      // ── Standard path (UNCHANGED) ─────────────────────────────────────────
      const scheduleLines =
        schedules && schedules.length
          ? schedules
              .map((s) => `${s.day_of_week}: training at ${s.session_time}`)
              .join("\n")
          : "No training sessions scheduled (treat all days as rest days).";

      const prompt = `Create a 7-day nutrition meal plan for the following athlete.

Athlete:
- Name: ${player.name}
- Age: ${player.age ?? "unknown"}
- Weight: ${player.weight_kg ?? "unknown"} kg
- Position: ${player.position || "unspecified"}
- Sport: ${academy?.sport_type ?? "unspecified"}
- Dietary restrictions: ${player.dietary_restrictions || "none"}

Weekly training schedule (any weekday NOT listed here is a rest day):
${scheduleLines}

Requirements:
- Return EXACTLY 7 day objects, Sunday through Saturday, in that order (the GCC week starts on Sunday).
- label is "Training Day" if that day has a training session above, otherwise "Rest Day".
- Training days: higher carbohydrate/energy intake, timed around the session. Rest days: lower.
- Strictly respect the dietary restrictions.
- Every meal string must include realistic portion sizes.
- estimated_calories is a number: total kcal for that whole day.
- focus_note is a single short line.
${
  wantArabic
    ? `- LANGUAGE: Write breakfast, lunch, dinner, snacks and focus_note in clear, natural Modern Standard Arabic. Keep the JSON keys in English, and keep the "day" values (Sunday…Saturday) and the "label" values ("Training Day" / "Rest Day") in English EXACTLY as written here — do not translate those.`
    : `- LANGUAGE: Write all meal descriptions and focus_note in English.`
}

Return ONLY valid JSON, no markdown, no code fences, no commentary, in exactly this shape:
{"days":[{"day":"Sunday","label":"Training Day","breakfast":"...","lunch":"...","dinner":"...","snacks":"...","estimated_calories":2800,"focus_note":"..."}]}`;

      // Try once, and if parsing/validation fails, retry exactly once.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const raw = await callClaude(
            "You are a professional sports nutritionist. You output ONLY valid JSON matching the requested schema exactly. No markdown, no code fences, no commentary.",
            prompt,
          );
          const parsed: unknown = JSON.parse(extractJson(raw));
          if (isValidPlan(parsed)) {
            plan = parsed;
            break;
          }
          lastError = "The AI returned JSON in an unexpected shape.";
        } catch (e) {
          lastError =
            e instanceof Error ? e.message : "Failed to parse AI output.";
        }
      }
    }

    if (!plan) {
      return NextResponse.json(
        {
          error: `We couldn't generate a valid plan. Please try again. (${lastError})`,
        },
        { status: 502 },
      );
    }

    // One current plan per player: replace any existing one.
    await supabase.from("meal_plans").delete().eq("player_id", playerId);
    const { error: insertError } = await supabase
      .from("meal_plans")
      .insert({ player_id: playerId, plan_json: plan });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}

// ── Ramadan plan builder ────────────────────────────────────────────────────
// Resolves the 7-day window's prayer times (DB → Aladhan, persisting any it
// fetches), classifies each day's training scenario, prompts Claude, guarantees
// a safety note, validates, and retries once. Returns null on failure.
async function buildRamadanPlanWithRetry(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  anthropic: { call: (system: string, prompt: string) => Promise<string> };
  player: Player;
  academy: Academy;
  schedules: TrainingSchedule[];
  wantArabic: boolean;
  onError: (m: string) => void;
}): Promise<RamadanPlanJson | null> {
  const { supabase, anthropic, player, academy, schedules, wantArabic, onError } =
    args;

  // The window starts at the academy's Ramadan start date, or today (so the
  // feature is testable at any time of year).
  const start = academy.ramadan_start_date ?? todayISO(new Date());
  const dates = windowDates(start);

  // Prayer times: read any already stored, fetch the rest from Aladhan, and
  // persist what we fetch so the director's times panel reflects it.
  const timeMap = new Map<string, { suhoor: string; iftar: string }>();
  const { data: existing } = await supabase
    .from("ramadan_days")
    .select("*")
    .eq("academy_id", academy.id)
    .in("day_date", dates);
  for (const r of existing ?? []) {
    timeMap.set(r.day_date as string, {
      suhoor: r.suhoor_time as string,
      iftar: r.iftar_time as string,
    });
  }

  const missing = dates.filter((d) => !timeMap.has(d));
  const fetched = await Promise.all(
    missing.map(
      async (d) =>
        [d, await fetchRamadanTimes(academy.city, academy.country, d)] as const,
    ),
  );
  const toUpsert: Array<{
    academy_id: string;
    day_date: string;
    suhoor_time: string;
    iftar_time: string;
    source: string;
  }> = [];
  for (const [d, t] of fetched) {
    if (t) {
      timeMap.set(d, t);
      toUpsert.push({
        academy_id: academy.id,
        day_date: d,
        suhoor_time: t.suhoor,
        iftar_time: t.iftar,
        source: "api",
      });
    }
  }
  if (toUpsert.length) {
    try {
      await supabase
        .from("ramadan_days")
        .upsert(toUpsert, { onConflict: "academy_id,day_date" });
    } catch {
      // Non-fatal: generation continues with the in-memory times.
    }
  }

  // Map each date to a weekday, its training session, and a scenario.
  const briefs: RamadanDayBrief[] = dates.map((date) => {
    const weekday = weekdayOf(date);
    const sched = schedules.find((s) => s.day_of_week === weekday);
    const isTraining = Boolean(sched);
    const trainingTime = (player.training_time || sched?.session_time) ?? null;
    const t = timeMap.get(date);
    const iftar = t?.iftar ?? null;
    const suhoor = t?.suhoor ?? null;
    const scenario = computeScenario({
      isTraining,
      isFasting: Boolean(player.is_fasting),
      trainingTime,
      iftar,
      suhoor,
    });
    return {
      date,
      weekday,
      label: isTraining ? "Training Day" : "Rest Day",
      trainingTime: isTraining ? trainingTime : null,
      scenario,
      iftar,
      suhoor,
    };
  });

  const { system, prompt } = buildRamadanPrompt({
    name: player.name,
    age: player.age ?? null,
    weightKg: player.weight_kg ?? null,
    position: player.position || "",
    sport: academy.sport_type || "",
    dietaryRestrictions: player.dietary_restrictions || "",
    isFasting: Boolean(player.is_fasting),
    arabic: wantArabic,
    days: briefs,
  });

  const fallbackNote = wantArabic ? SAFETY_FALLBACK_AR : SAFETY_FALLBACK_EN;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await anthropic.call(system, prompt);
      const parsed = JSON.parse(extractJson(raw)) as Record<string, unknown>;
      // Guarantee a safety note even if the model omitted one — a Ramadan plan
      // must never render without medical-oversight guidance.
      if (
        typeof parsed.safety_note !== "string" ||
        !parsed.safety_note.trim()
      ) {
        parsed.safety_note = fallbackNote;
      }
      if (isValidRamadanPlan(parsed)) return parsed;
      onError("The AI returned a Ramadan plan in an unexpected shape.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to parse AI output.");
    }
  }
  return null;
}
