type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (type: MealType) => void;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MEAL_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            value === type
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  );
}
