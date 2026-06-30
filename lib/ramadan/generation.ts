// Ramadan plan: prompt construction + strict validation.
// Kept separate from the standard generation path so that path is untouched.

import type {
  RamadanPlanJson,
  RamadanTrainingScenario,
  RamadanSegment,
} from "@/lib/types";

export type RamadanDayBrief = {
  date: string; // yyyy-mm-dd
  weekday: string; // Sunday…Saturday
  label: "Training Day" | "Rest Day";
  trainingTime: string | null;
  scenario: RamadanTrainingScenario;
  iftar: string | null;
  suhoor: string | null;
};

export type RamadanPromptInput = {
  name: string;
  age: number | null;
  weightKg: number | null;
  position: string;
  sport: string;
  dietaryRestrictions: string;
  isFasting: boolean;
  arabic: boolean;
  days: RamadanDayBrief[];
};

// A safe default disclaimer, used only if the model somehow omits one. The
// validator requires a non-empty safety_note, so a plan never renders without
// guidance — this guarantees we always have something sound to fall back to.
export const SAFETY_FALLBACK_EN =
  "This plan is general nutrition guidance for Ramadan training, not medical advice. " +
  "Fasting while training is the athlete's and family's choice — the academy's coaching and medical staff and the athlete's guardians should oversee it. " +
  "Stop training and tell a coach, guardian or medical staff straight away if you feel dizzy, faint, unusually exhausted, or unwell. Never push through clear distress, and never skip suhoor to lose weight.";

export const SAFETY_FALLBACK_AR =
  "هذه الخطة إرشادات تغذية عامة للتدريب في رمضان، وليست نصيحة طبية. الصيام مع التدريب اختيار اللاعب وعائلته — وينبغي أن يشرف عليه الطاقم التدريبي والطبي في الأكاديمية وأولياء أمر اللاعب. " +
  "توقّف عن التدريب وأخبر المدرّب أو وليّ الأمر أو الطاقم الطبي فورًا إذا شعرت بدوخة أو إغماء أو إرهاق غير معتاد أو توعّك. لا تُكمل رغم التعب الواضح، ولا تتخطَّ السحور بهدف إنقاص الوزن.";

const SCENARIO_GUIDANCE: Record<RamadanTrainingScenario, string> = {
  before_iftar:
    "Trains FASTED in the hours before sunset. Keep intensity lower; schedule the session to finish close to iftar so the athlete refuels immediately. Emphasise the iftar rehydration and the post-iftar recovery meal.",
  after_iftar:
    "Trains FED, after breaking the fast. Higher intensity is sustainable. Provide a pre-training fuel after iftar (and before the session) and a clear recovery meal/snack after the session.",
  after_suhoor:
    "Trains FASTED in the morning, with a long time until iftar. Emphasise a strong suhoor, keep intensity conservative, and give clear hydration cut-off planning toward dawn. No fluids are possible during the session — plan accordingly.",
  none: "Rest day — no training. Focus on recovery, steady refueling and hydration across the eating window.",
};

export function buildRamadanPrompt(input: RamadanPromptInput): {
  system: string;
  prompt: string;
} {
  const fasting = input.isFasting;

  const system =
    "You are a professional sports nutritionist who specialises in fasting and training during Ramadan for ADOLESCENT athletes (ages ~14–18) in the hot Gulf climate. " +
    "You are safety-first and responsible: you never encourage unsafe restriction, never suggest skipping suhoor to cut weight, and never advise training through clear distress. " +
    "You treat hydration as first-class. You output ONLY valid JSON matching the requested schema exactly — no markdown, no code fences, no commentary.";

  const dayBriefs = input.days
    .map((d, idx) => {
      const lines = [
        `Day ${idx + 1} — ${d.weekday} (${d.date}) — ${d.label}`,
        `  Suhoor (dawn cutoff): ${d.suhoor ?? "unknown"} | Iftar (sunset): ${d.iftar ?? "unknown"}`,
      ];
      if (d.label === "Training Day") {
        lines.push(
          `  Training time: ${d.trainingTime ?? "unspecified"} — ${SCENARIO_GUIDANCE[d.scenario]}`,
        );
      } else {
        lines.push(`  ${SCENARIO_GUIDANCE.none}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const fastingBlockSpec = `For each FASTING day, structure "segments" as this ordered sequence:
  1. {"key":"suhoor"} — the pre-dawn meal: slow-digesting complex carbs, quality protein, healthy fats and fluids; foods that sustain energy and minimise daytime thirst. AVOID heavily salted or fried foods that worsen dehydration.
  2. {"key":"iftar"} — breaking the fast at sunset: begin with gentle rehydration and easily digestible food (dates + water is a good anchor), THEN a balanced meal. Explicitly avoid the post-fast overeating / sugar-crash pattern.
  3. {"key":"post_iftar"} — the real fueling & recovery block in the evening: distribute protein and glycogen replenishment here.
  4. {"key":"pre_suhoor"} — a late snack before sleeping/suhoor that continues recovery and hydration.
Do NOT cram the day's nutrition into one sitting; spread it across iftar → suhoor.`;

  const nonFastingBlockSpec = `This athlete is NOT fasting (medical exemption, age, or personal/family choice — never imply they should fast). Build a normal, balanced day, but align meal timing to the academy's shifted Ramadan training schedule and be considerate that teammates are fasting. Use "segments" with key "meal" for each eating occasion (e.g. breakfast, pre-training, lunch, post-training, dinner), each with realistic foods and portions.`;

  const prompt = `Create a 7-day RAMADAN nutrition plan for the following adolescent athlete.

Athlete:
- Name: ${input.name}
- Age: ${input.age ?? "unknown"}
- Weight: ${input.weightKg ?? "unknown"} kg
- Position: ${input.position || "unspecified"}
- Sport: ${input.sport || "unspecified"}
- Dietary restrictions: ${input.dietaryRestrictions || "none"}
- Fasting this Ramadan: ${fasting ? "YES" : "NO"}

The 7 days (already mapped to real dates and prayer times):

${dayBriefs}

${fasting ? fastingBlockSpec : nonFastingBlockSpec}

For EVERY day also provide:
- "hydration": a concrete strategy to spread total daily fluids steadily across the ${fasting ? "iftar → suhoor window (never all at once)" : "day"}, INCLUDING electrolyte guidance (e.g. sodium/potassium, lightly salted fluids, dairy/laban), tuned for Gulf heat.
- "estimated_calories": a number — total kcal for the whole day.
- "focus_note": one short line for the athlete.
- "training_scenario": echo back exactly the scenario given for that day (one of before_iftar, after_iftar, after_suhoor, none).
- Strictly respect the dietary restrictions.

Also provide a single top-level "safety_note": brief, calm, non-alarming. It must say this is general guidance, not medical advice; that academy coaching/medical staff and the athlete's guardians should oversee fasting + training; and that the athlete should stop and seek help (guardian/medical staff) on warning signs like dizziness, faintness or unusual exhaustion rather than pushing through.

${input.arabic ? "WRITE ALL human-readable text (segment titles, focus, foods, hydration, focus_note, safety_note) in clear, natural Modern Standard Arabic. Keep every JSON KEY in English, keep the enum values (key, training_scenario, label, day weekday names Sunday…Saturday) in English EXACTLY as specified." : "Write all human-readable text in English."}

Return ONLY valid JSON, no markdown, no code fences, no commentary, in EXACTLY this shape:
{"mode":"ramadan","safety_note":"...","days":[{"day":"Sunday","date":"2026-03-01","label":"Training Day","is_fasting":${fasting},"iftar_time":"18:00","suhoor_time":"04:30","training_time":"16:30","training_scenario":"before_iftar","segments":[{"key":"suhoor","title":"...","time":"04:30","focus":"...","foods":"..."}],"hydration":"...","estimated_calories":2800,"focus_note":"..."}]}`;

  return { system, prompt };
}

// ── Validation ──────────────────────────────────────────────────────────────

const SEGMENT_KEYS = new Set<RamadanSegment["key"]>([
  "suhoor",
  "iftar",
  "post_iftar",
  "pre_suhoor",
  "meal",
]);
const SCENARIOS = new Set<RamadanTrainingScenario>([
  "before_iftar",
  "after_iftar",
  "after_suhoor",
  "none",
]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidSegment(s: unknown): s is RamadanSegment {
  if (typeof s !== "object" || s === null) return false;
  const x = s as Record<string, unknown>;
  return (
    SEGMENT_KEYS.has(x.key as RamadanSegment["key"]) &&
    isNonEmptyString(x.title) &&
    isNonEmptyString(x.focus) &&
    isNonEmptyString(x.foods)
  );
}

// Strict shape check so a malformed Ramadan plan never reaches the player page.
// Crucially: a non-empty safety_note is REQUIRED — no plan renders without it.
export function isValidRamadanPlan(obj: unknown): obj is RamadanPlanJson {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (o.mode !== "ramadan") return false;
  if (!isNonEmptyString(o.safety_note)) return false;
  const days = o.days;
  if (!Array.isArray(days) || days.length !== 7) return false;

  return days.every((d) => {
    if (typeof d !== "object" || d === null) return false;
    const x = d as Record<string, unknown>;
    return (
      typeof x.day === "string" &&
      (x.label === "Training Day" || x.label === "Rest Day") &&
      typeof x.is_fasting === "boolean" &&
      SCENARIOS.has(x.training_scenario as RamadanTrainingScenario) &&
      Array.isArray(x.segments) &&
      x.segments.length >= 1 &&
      x.segments.every(isValidSegment) &&
      isNonEmptyString(x.hydration) &&
      typeof x.estimated_calories === "number" &&
      typeof x.focus_note === "string"
    );
  });
}
