const OFT_BASE = "https://world.openfoodfacts.org/api/v2/product";

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servingSizeG?: number;
  unit: "g" | "ml";
  source?: "barcode" | "photo";
  confidence?: "low" | "medium" | "high";
  confidenceReason?: string;
  notes?: string;
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `${OFT_BASE}/${barcode}.json?fields=product_name,brands,image_url,nutriments,serving_size`;
  const r = await fetch(url);
  if (!r.ok) return null;

  const data = await r.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

  const { size, unit } = parseServingSize(p.serving_size);

  return {
    barcode,
    name: p.product_name ?? "Unknown product",
    brand: p.brands ?? "",
    imageUrl: p.image_url,
    per100g: {
      calories: n["energy-kcal_100g"] ?? 0,
      protein: n["proteins_100g"] ?? 0,
      carbs: n["carbohydrates_100g"] ?? 0,
      fat: n["fat_100g"] ?? 0,
    },
    servingSizeG: size,
    unit,
  };
}

function parseServingSize(raw: string | undefined): { size?: number; unit: "g" | "ml" } {
  if (!raw) return { unit: "g" };
  const mlMatch = raw.match(/(\d+(\.\d+)?)\s*ml/i);
  if (mlMatch) return { size: parseFloat(mlMatch[1]), unit: "ml" };
  const gMatch = raw.match(/(\d+(\.\d+)?)\s*g/i);
  if (gMatch) return { size: parseFloat(gMatch[1]), unit: "g" };
  return { unit: "g" };
}
