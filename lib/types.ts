// Shared types used across the app.
// Database row shapes (mirror the Supabase schema) and the AI meal-plan JSON shape.

export type Academy = {
  id: string;
  owner_id: string;
  name: string;
  sport_type: string;
  created_at: string;
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
};

export type MealPlan = {
  id: string;
  player_id: string;
  plan_json: MealPlanJson;
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
