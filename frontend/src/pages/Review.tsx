import { useNavigate } from "react-router-dom";
import { useScanStore } from "../stores/scanStore";
import { ServingInput } from "../components/ServingInput";
import { MealTypeSelector } from "../components/MealTypeSelector";

export function Review() {
  const navigate = useNavigate();
  const product = useScanStore((s) => s.product);
  const mealType = useScanStore((s) => s.mealType);
  const setMealType = useScanStore((s) => s.setMealType);
  const reset = useScanStore((s) => s.reset);

  const handleBack = () => {
    reset();
    navigate("/");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No product scanned</p>
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Review</h1>
        </div>

        {/* Product info */}
        <div className="flex gap-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-lg bg-zinc-800"
            />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-medium">{product.name}</h2>
            {product.brand && (
              <p className="text-zinc-400 text-sm">{product.brand}</p>
            )}
            <p className="text-zinc-500 text-xs mt-1">Barcode: {product.barcode}</p>
          </div>
        </div>

        {/* Serving size input and computed macros */}
        <ServingInput />

        {/* Meal type selector */}
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Meal type</label>
          <MealTypeSelector value={mealType} onChange={setMealType} />
        </div>

        {/* Log button */}
        <button
          onClick={() => navigate("/confirm")}
          className="w-full py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-zinc-200 transition-colors"
        >
          Log Entry
        </button>
      </div>
    </div>
  );
}
