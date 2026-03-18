const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3201";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}`);
  return r.json();
}

export interface MealPayload {
  date: string;
  time: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  notes?: string;
}

export interface MealResponse {
  id: number;
  date: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: string;
  created_at: string;
}

export interface DailyReport {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meals: MealResponse[];
}

export const logMeal = (payload: MealPayload) =>
  req<MealResponse>("POST", "/meals", payload);

export const getDailyReport = (date: string) =>
  req<DailyReport>("GET", `/reports/daily?date=${date}`);
