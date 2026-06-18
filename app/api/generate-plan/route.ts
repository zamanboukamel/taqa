import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { MealPlanJson } from "@/lib/types";

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
    const body = (await req.json()) as { playerId?: string };
    const playerId = body.playerId;
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
- Return EXACTLY 7 day objects, Monday through Sunday, in that order.
- label is "Training Day" if that day has a training session above, otherwise "Rest Day".
- Training days: higher carbohydrate/energy intake, timed around the session. Rest days: lower.
- Strictly respect the dietary restrictions.
- Every meal string must include realistic portion sizes.
- estimated_calories is a number: total kcal for that whole day.
- focus_note is a single short line.

Return ONLY valid JSON, no markdown, no code fences, no commentary, in exactly this shape:
{"days":[{"day":"Monday","label":"Training Day","breakfast":"...","lunch":"...","dinner":"...","snacks":"...","estimated_calories":2800,"focus_note":"..."}]}`;

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

    async function callClaude(): Promise<string> {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system:
          "You are a professional sports nutritionist. You output ONLY valid JSON matching the requested schema exactly. No markdown, no code fences, no commentary.",
        messages: [{ role: "user", content: prompt }],
      });
      return msg.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");
    }

    // Try once, and if parsing/validation fails, retry exactly once.
    let plan: MealPlanJson | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callClaude();
        const parsed: unknown = JSON.parse(extractJson(raw));
        if (isValidPlan(parsed)) {
          plan = parsed;
          break;
        }
        lastError = "The AI returned JSON in an unexpected shape.";
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Failed to parse AI output.";
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
