interface MacroRowProps {
  label: string;
  value: number;
  unit?: string;
}

export function MacroRow({ label, value, unit = "g" }: MacroRowProps) {
  return (
    <div className="flex justify-between py-2 border-b border-zinc-800">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-medium">
        {value}
        {unit !== "kcal" && unit}
        {unit === "kcal" && " kcal"}
      </span>
    </div>
  );
}
