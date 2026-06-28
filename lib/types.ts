// Shared types used across the app.
// Database row shapes (mirror the Supabase schema) and the AI meal-plan JSON shape.

export type Academy = {
  id: string;
  owner_id: string;
  name: string;
  sport_type: string;
  created_at: string;
  // Ramadan Mode (see supabase/ramadan-mode.sql)
  ramadan_mode: boolean;
  city: string;
  country: string;
  ramadan_start_date: string | null;
};

export type TrainingSchedule = {
  id: string;
  academy_id: string;
  day_of_week: string;
  session_time: string;
};

export type Player = {
  id: string;
  academy_id: string;
  name: string;
  age: number;
  weight_kg: number;
  position: string;
  dietary_restrictions: string;
  access_token: string;
  created_at: string;
  // Ramadan Mode overrides. ramadan_mode null => inherit the academy default.
  ramadan_mode: boolean | null;
  is_fasting: boolean;
  training_time: string | null;
};

export type RamadanDayTimes = {
  id: string;
  academy_id: string;
  day_date: string; // ISO yyyy-mm-dd
  suhoor_time: string; // "HH:MM"
  iftar_time: string; // "HH:MM"
  source: "api" | "manual";
  updated_at: string;
};

export type MealPlan = {
  id: string;
  player_id: string;
  // Either a standard plan or a Ramadan plan, discriminated by `mode`.
  plan_json: AnyPlanJson;
  generated_at: string;
};

// The exact JSON shape Claude must return.
export type MealPlanDay = {
  day: string;
  label: "Training Day" | "Rest Day";
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  estimated_calories: number;
  focus_note: string;
};

export type MealPlanJson = {
  days: MealPlanDay[];
};

// ── Ramadan plan shape ─────────────────────────────────────────────────────
// A Ramadan plan is structured around the fasting day, not the clock. Each day
// is a series of eating "segments" (Suhoor → Iftar → Post-Iftar → Pre-Suhoor
// for fasting athletes; normal meal blocks for non-fasting ones), plus a
// first-class hydration strategy and a training-relative scenario.

// How the day's training sits relative to the fast.
export type RamadanTrainingScenario =
  | "before_iftar" // trains fasted, finishing near sunset — keep it lighter
  | "after_iftar" // trains fed, after breaking the fast — can go harder
  | "after_suhoor" // trains fasted in the morning, long way to iftar
  | "none"; // rest day / no training

export type RamadanSegment = {
  key: "suhoor" | "iftar" | "post_iftar" | "pre_suhoor" | "meal";
  title: string; // e.g. "Suhoor — pre-dawn"
  time?: string; // "HH:MM" if known
  focus: string; // the nutritional intent of this block
  foods: string; // concrete foods with realistic portions
};

export type RamadanDay = {
  day: string; // weekday (Sunday…Saturday) — sort key, like the standard plan
  date?: string; // ISO yyyy-mm-dd when known
  label: "Training Day" | "Rest Day";
  is_fasting: boolean;
  iftar_time?: string;
  suhoor_time?: string;
  training_time?: string;
  training_scenario: RamadanTrainingScenario;
  segments: RamadanSegment[];
  hydration: string; // spread-across-the-window strategy + electrolytes
  estimated_calories: number;
  focus_note: string;
};

export type RamadanPlanJson = {
  mode: "ramadan";
  safety_note: string; // medical-oversight + warning-signs disclaimer
  days: RamadanDay[];
};

// What lives in meal_plans.plan_json. A standard plan has no `mode` field; a
// Ramadan plan is tagged with `mode: "ramadan"`.
export type AnyPlanJson = MealPlanJson | RamadanPlanJson;

export function isRamadanPlan(plan: AnyPlanJson): plan is RamadanPlanJson {
  return (plan as RamadanPlanJson).mode === "ramadan";
}
