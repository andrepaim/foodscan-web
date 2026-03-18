import { useNavigate } from "react-router-dom";
import { useScanStore } from "../stores/scanStore";
import { logMeal } from "../api/client";
import type { MealPayload } from "../api/client";
import { MacroRow } from "../components/MacroRow";
import { useState } from "react";

export function Confirm() {
  const navigate = useNavigate();
  const product = useScanStore((s) => s.product);
  const servingGrams = useScanStore((s) => s.servingGrams);
  const mealType = useScanStore((s) => s.mealType);
  const computedMacros = useScanStore((s) => s.computedMacros);
  const isLogging = useScanStore((s) => s.isLogging);
  const logError = useScanStore((s) => s.logError);
  const setLogging = useScanStore((s) => s.setLogging);
  const setLogError = useScanStore((s) => s.setLogError);
  const reset = useScanStore((s) => s.reset);

  const [success, setSuccess] = useState(false);

  const macros = computedMacros();
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 5);

  const handleConfirm = async () => {
    if (!product) return;

    setLogging(true);
    setLogError(null);

    const payload: MealPayload = {
      date,
      time,
      description: `${product.name} ${servingGrams}g`,
      calories: macros.calories,
      protein_g: macros.protein,
      carbs_g: macros.carbs,
      fat_g: macros.fat,
      meal_type: mealType,
      notes: `barcode: ${product.barcode}`,
    };

    try {
      await logMeal(payload);
      setSuccess(true);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLogging(false);
    }
  };

  const handleScanAnother = () => {
    reset();
    navigate("/");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No product to confirm</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium"
          >
            Go to Scanner
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="text-6xl">✓</div>
          <h1 className="text-2xl font-semibold">Meal Logged</h1>
          <p className="text-zinc-400">
            {product.name} ({servingGrams}g) recorded as {mealType}
          </p>
          <button
            onClick={handleScanAnother}
            className="w-full py-4 bg-white text-black rounded-lg font-semibold text-lg"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/review")}
            className="text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Confirm</h1>
        </div>

        {/* Summary card */}
        <div className="bg-zinc-900 rounded-lg p-4 space-y-4">
          <div>
            <p className="text-zinc-500 text-sm">Product</p>
            <p className="text-white font-medium">{product.name}</p>
            {product.brand && <p className="text-zinc-400 text-sm">{product.brand}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 text-sm">Serving</p>
              <p className="text-white font-medium">{servingGrams}g</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm">Meal</p>
              <p className="text-white font-medium capitalize">{mealType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 text-sm">Date</p>
              <p className="text-white font-medium">{date}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-sm">Time</p>
              <p className="text-white font-medium">{time}</p>
            </div>
          </div>
        </div>

        {/* Nutrition summary */}
        <div className="bg-zinc-900 rounded-lg p-4">
          <p className="text-zinc-500 text-sm mb-2">Nutrition</p>
          <MacroRow label="Calories" value={macros.calories} unit="kcal" />
          <MacroRow label="Protein" value={macros.protein} />
          <MacroRow label="Carbs" value={macros.carbs} />
          <MacroRow label="Fat" value={macros.fat} />
        </div>

        {/* Error message */}
        {logError && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">{logError}</p>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={isLogging}
          className="w-full py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLogging ? "Logging..." : "Confirm & Log"}
        </button>

        {logError && (
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
