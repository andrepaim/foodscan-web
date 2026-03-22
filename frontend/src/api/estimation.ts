import type { FoodProduct } from "./foodfacts";

export interface EstimationResult extends FoodProduct {
  source: "photo";
  confidence: "low" | "medium" | "high";
  confidenceReason: string;
  notes: string;
}

export async function estimateFromPhoto(
  imageBase64: string,
  mediaType: string = "image/jpeg"
): Promise<EstimationResult> {
  const r = await fetch("/estimate/photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64, media_type: mediaType }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Estimation failed (${r.status})`);
  }
  return r.json();
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix — backend handles raw base64
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
