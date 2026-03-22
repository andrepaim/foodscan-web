import { useState, useEffect } from "react";
import { useScanStore } from "../stores/scanStore";
import { MacroRow } from "./MacroRow";

export function ServingInput() {
  const servingGrams = useScanStore((s) => s.servingGrams);
  const setServingGrams = useScanStore((s) => s.setServingGrams);
  const computedMacros = useScanStore((s) => s.computedMacros);
  const product = useScanStore((s) => s.product);

  // Local string state so backspace works freely
  const [raw, setRaw] = useState(String(servingGrams));

  // Sync if store changes externally (e.g. product swap)
  useEffect(() => {
    setRaw(String(servingGrams));
  }, [servingGrams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRaw(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setServingGrams(num);
    }
  };

  const handleBlur = () => {
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) {
      setRaw(String(servingGrams)); // revert to last valid
    }
  };

  const macros = computedMacros();
  const unit = product?.unit ?? "g";
  const isPhotoEstimate = (product as any)?.source === "photo";
  const confidence = (product as any)?.confidence ?? "high";
  const confidenceReason = (product as any)?.confidenceReason ?? "";
  const hasZeroNutrition =
    product &&
    product.per100g.calories === 0 &&
    product.per100g.protein === 0 &&
    product.per100g.carbs === 0 &&
    product.per100g.fat === 0;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-zinc-400 text-sm mb-2">
          Serving size ({unit === "ml" ? "ml" : "grams"})
        </label>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-zinc-500"
        />
      </div>

      {isPhotoEstimate && (
        <div className={`rounded-lg p-3 text-sm border ${
          confidence === "high"
            ? "bg-blue-900/30 border-blue-700 text-blue-300"
            : confidence === "medium"
            ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
            : "bg-red-900/30 border-red-700 text-red-300"
        }`}>
          <p className="font-medium">⚠️ AI estimate — verify before logging</p>
          {confidenceReason && (
            <p className="mt-1 text-xs opacity-80">{confidenceReason}</p>
          )}
        </div>
      )}

      {hasZeroNutrition && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-400 text-sm">
          Warning: No nutrition data available for this product
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-500 text-sm mb-2">
          Nutrition for {raw || servingGrams}{unit}
        </p>
        <MacroRow label="Calories" value={macros.calories} unit="kcal" />
        <MacroRow label="Protein" value={macros.protein} />
        <MacroRow label="Carbs" value={macros.carbs} />
        <MacroRow label="Fat" value={macros.fat} />
      </div>
    </div>
  );
}
