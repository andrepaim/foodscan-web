import { useScanStore } from "../stores/scanStore";
import { MacroRow } from "./MacroRow";

export function ServingInput() {
  const servingGrams = useScanStore((s) => s.servingGrams);
  const setServingGrams = useScanStore((s) => s.setServingGrams);
  const computedMacros = useScanStore((s) => s.computedMacros);
  const product = useScanStore((s) => s.product);

  const macros = computedMacros();
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
          Serving size (grams)
        </label>
        <input
          type="number"
          min="1"
          value={servingGrams}
          onChange={(e) => setServingGrams(Math.max(1, Number(e.target.value)))}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-zinc-500"
        />
      </div>

      {hasZeroNutrition && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-400 text-sm">
          Warning: No nutrition data available for this product
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg p-4">
        <p className="text-zinc-500 text-sm mb-2">Nutrition for {servingGrams}g</p>
        <MacroRow label="Calories" value={macros.calories} unit="kcal" />
        <MacroRow label="Protein" value={macros.protein} />
        <MacroRow label="Carbs" value={macros.carbs} />
        <MacroRow label="Fat" value={macros.fat} />
      </div>
    </div>
  );
}
