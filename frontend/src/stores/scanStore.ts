import { create } from "zustand";
import type { FoodProduct } from "../api/foodfacts";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface ScanState {
  product: FoodProduct | null;
  servingGrams: number;
  mealType: MealType;
  isLogging: boolean;
  logError: string | null;

  setProduct: (p: FoodProduct | null) => void;
  setServingGrams: (g: number) => void;
  setMealType: (t: MealType) => void;
  setLogging: (v: boolean) => void;
  setLogError: (e: string | null) => void;
  reset: () => void;

  computedMacros: () => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const useScanStore = create<ScanState>((set, get) => ({
  product: null,
  servingGrams: 100,
  mealType: "lunch",
  isLogging: false,
  logError: null,

  setProduct: (p) => set({ product: p, servingGrams: p?.servingSizeG ?? 100 }),
  setServingGrams: (g) => set({ servingGrams: g }),
  setMealType: (t) => set({ mealType: t }),
  setLogging: (v) => set({ isLogging: v }),
  setLogError: (e) => set({ logError: e }),

  reset: () =>
    set({
      product: null,
      servingGrams: 100,
      mealType: "lunch",
      isLogging: false,
      logError: null,
    }),

  computedMacros: () => {
    const { product, servingGrams } = get();
    if (!product) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const ratio = servingGrams / 100;
    return {
      calories: Math.round(product.per100g.calories * ratio),
      protein: parseFloat((product.per100g.protein * ratio).toFixed(1)),
      carbs: parseFloat((product.per100g.carbs * ratio).toFixed(1)),
      fat: parseFloat((product.per100g.fat * ratio).toFixed(1)),
    };
  },
}));
