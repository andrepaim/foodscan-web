# FoodScan — Design Document v1.0
**Status:** Ready for implementation  
**Author:** The Calorie Accountant  
**Date:** 2026-03-18  
**Reference architectures:** `/root/distillpod`, `/root/galo-routine`

---

## 1. Overview

FoodScan is a mobile barcode scanner app that logs food intake directly into the Calorie Accountant backend. The user scans a product barcode → reviews nutrition facts + adjusts serving size → confirms → the meal is POST'd to the API.

No dashboards. No charts. No social features. A scanner, a review screen, and a submit button. The Calorie Accountant handles the rest.

---

## 2. Architecture

```
┌─────────────────────────────┐
│     FoodScan (Expo app)     │
│                             │
│  Scanner → Review → Confirm │
│       (React Native)        │
└────────────┬────────────────┘
             │ REST
             ▼
┌─────────────────────────────┐        ┌────────────────────────┐
│  Calorie Accountant API     │        │   Open Food Facts API  │
│  http://[host]:3201         │        │   world.openfoodfacts   │
│  (existing FastAPI backend) │        │   .org/api/v2/product/  │
└─────────────────────────────┘        └────────────────────────┘
```

The app fetches nutrition data from Open Food Facts (external, free, no key needed), then logs the meal to the existing Calorie Accountant API.

---

## 3. Tech Stack

| Layer | Choice | Reference |
|-------|--------|-----------|
| Framework | **Expo SDK 51+ (React Native)** | — |
| Language | **TypeScript** | Both distillpod and galo-routine use TS throughout |
| Barcode scanner | **expo-camera** (built-in barcode scanning) | — |
| State management | **Zustand** | distillpod: `stores/queueStore.ts` / galo-routine: zustand stores |
| Navigation | **expo-router** (file-based, like React Router) | analogous to react-router-dom used in both refs |
| Styling | **NativeWind v4** (Tailwind CSS for React Native) | Both refs use Tailwind CSS |
| HTTP client | **fetch** (same pattern as distillpod `api/client.ts`) | `req<T>()` pattern |
| Config | **`constants/config.ts`** (env-based base URL) | distillpod: `import.meta.env.VITE_API_URL` |
| Food data | **Open Food Facts REST API** | — |

---

## 4. Project Structure

Mirrors the distillpod/galo-routine convention: `api/`, `stores/`, `pages/` (here: `app/` for expo-router), `components/`, `constants/`.

```
foodscan/
├── app/                        # expo-router screens (= pages/ in refs)
│   ├── _layout.tsx             # Root layout, navigation setup
│   ├── index.tsx               # Scanner screen (entry point)
│   ├── review.tsx              # Product review + serving size
│   └── confirm.tsx             # Final confirmation + log
├── api/
│   ├── client.ts               # Calorie Accountant API (mirrors distillpod api/client.ts)
│   └── foodfacts.ts            # Open Food Facts API wrapper
├── stores/
│   └── scanStore.ts            # Zustand store (mirrors distillpod stores/queueStore.ts)
├── components/
│   ├── MacroRow.tsx            # Reusable macro display (cal / protein / carbs / fat)
│   ├── MealTypeSelector.tsx    # breakfast / lunch / dinner / snack picker
│   └── ServingInput.tsx        # Gram input with live macro recalculation
├── constants/
│   └── config.ts               # BASE_URL, timeouts (mirrors distillpod config pattern)
├── assets/
│   └── icon.png
├── app.json
├── package.json
├── tsconfig.json
└── .env                        # EXPO_PUBLIC_API_URL=http://[your-host]:3201
```

---

## 5. API Layer

### 5.1 `api/client.ts` — Calorie Accountant (mirrors distillpod pattern exactly)

```typescript
// api/client.ts
import { BASE_URL } from "../constants/config";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}`);
  return r.json();
}

// Types
export interface MealPayload {
  date: string;          // "YYYY-MM-DD"
  time: string;          // "HH:MM"
  description: string;   // "Quaker Oats 80g"
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  notes?: string;        // "barcode: 1234567890"
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

// API calls
export const logMeal = (payload: MealPayload) =>
  req<MealResponse>("POST", "/meals", payload);

export const getDailyReport = (date: string) =>
  req<DailyReport>("GET", `/reports/daily?date=${date}`);

export interface DailyReport {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meals: MealResponse[];
}
```

### 5.2 `api/foodfacts.ts` — Open Food Facts wrapper

```typescript
// api/foodfacts.ts
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
  servingSizeG?: number; // from product data, may be null
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `${OFT_BASE}/${barcode}.json?fields=product_name,brands,image_url,nutriments,serving_size`;
  const r = await fetch(url);
  if (!r.ok) return null;

  const data = await r.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};

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
    servingSizeG: parseServingSize(p.serving_size),
  };
}

function parseServingSize(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+(\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : undefined;
}
```

---

## 6. State Management

### `stores/scanStore.ts` — Zustand (mirrors distillpod `stores/queueStore.ts`)

```typescript
// stores/scanStore.ts
import { create } from "zustand";
import { FoodProduct } from "../api/foodfacts";

interface ScanState {
  // Scanned product
  product: FoodProduct | null;
  setProduct: (p: FoodProduct | null) => void;

  // User inputs
  servingGrams: number;
  setServingGrams: (g: number) => void;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  setMealType: (t: ScanState["mealType"]) => void;

  // Submission state
  isLogging: boolean;
  logError: string | null;
  setLogging: (v: boolean) => void;
  setLogError: (e: string | null) => void;

  // Derived: compute macros for current serving
  computedMacros: () => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };

  reset: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  product: null,
  setProduct: (p) => set({ product: p, servingGrams: p?.servingSizeG ?? 100 }),

  servingGrams: 100,
  setServingGrams: (g) => set({ servingGrams: g }),

  mealType: "lunch",
  setMealType: (t) => set({ mealType: t }),

  isLogging: false,
  logError: null,
  setLogging: (v) => set({ isLogging: v }),
  setLogError: (e) => set({ logError: e }),

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

  reset: () => set({
    product: null,
    servingGrams: 100,
    mealType: "lunch",
    isLogging: false,
    logError: null,
  }),
}));
```

---

## 7. Screens

### Screen 1 — Scanner (`app/index.tsx`)
- Full-screen camera view with barcode overlay frame
- `expo-camera` with `onBarcodeScanned` callback
- On scan: calls `lookupBarcode()` → on success → navigate to `/review`
- On failure (product not found): show inline error toast, stay on scanner
- States: `idle` | `scanning` | `loading` | `not_found`

### Screen 2 — Review (`app/review.tsx`)
- Product name + brand (large text)
- Product image (if available, from Open Food Facts)
- Nutrition table per 100g (reference column, greyed out)
- **ServingInput**: gram input field, defaults to product serving size or 100g
  - As user types grams → live macro recalculation via `computedMacros()`
- Macro summary for computed serving: calories / protein / carbs / fat
- **MealTypeSelector**: 4 buttons — breakfast / lunch / dinner / snack
- CTA: **"Log Entry"** → navigate to `/confirm`
- Back button → resets store, returns to scanner

### Screen 3 — Confirm (`app/confirm.tsx`)
- Final summary (read-only): product, serving, macros, meal type, time, date
- "Confirm & Log" button → calls `logMeal()` → shows success/error
- On success: shows confirmation message + "Scan Another" button → resets store, back to scanner
- On error: shows error text, retry button

---

## 8. Configuration

### `constants/config.ts`

```typescript
// constants/config.ts
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3201";
```

### `.env` (not committed)
```
EXPO_PUBLIC_API_URL=http://your-vps-domain.com:3201
```

**Network access:** The backend at `localhost:3201` is not reachable from a phone. Before building the app, expose the API publicly. Recommended approach:

```nginx
# /etc/nginx/sites-available/calorie-api
server {
    listen 80;
    server_name cal.yourdomain.com;  # or use DuckDNS like distillpod

    location / {
        proxy_pass http://127.0.0.1:3201;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then `certbot --nginx -d cal.yourdomain.com` for HTTPS.  
Set `.env`: `EXPO_PUBLIC_API_URL=https://cal.yourdomain.com`

---

## 9. Package Dependencies

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-camera": "~15.0.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "zustand": "^5.0.0",
    "nativewind": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "~18.2.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 10. Data Flow (End-to-End)

```
User opens app
    │
    ▼
[Scanner Screen]
    │  points camera at barcode
    ▼
expo-camera.onBarcodeScanned(barcode)
    │
    ▼
lookupBarcode(barcode) → Open Food Facts API
    │  returns FoodProduct or null
    ▼
useScanStore.setProduct(product)
    │
    ▼
[Review Screen]
    │  user adjusts grams → computedMacros() recalculates live
    │  user selects meal type
    │  user taps "Log Entry"
    ▼
[Confirm Screen]
    │  shows final summary
    │  user taps "Confirm & Log"
    ▼
logMeal(payload) → POST /meals to Calorie Accountant API
    │
    ▼
Success → "Meal logged. Entry recorded." → scan another
Failure → error text + retry
```

---

## 11. What the Vibe Coder Should Know

1. **Reference projects:** `/root/distillpod` (FastAPI + React/Vite/Tailwind/Zustand) and `/root/galo-routine` (Express + React/Vite/Tailwind/Zustand). Mirror the same patterns: centralized `api/client.ts`, Zustand stores, TypeScript throughout, Tailwind for styling.

2. **This is Expo (React Native), not web.** Use `expo-router` for navigation (not react-router-dom), `NativeWind` for Tailwind (not plain Tailwind), `expo-camera` for barcode scanning.

3. **API client pattern** must match distillpod exactly — a single `req<T>()` function, typed interfaces, named exports per endpoint.

4. **Zustand store** mirrors distillpod's `stores/queueStore.ts` — single store, computed derived values inside the store (not in components).

5. **Base URL is configurable** via `EXPO_PUBLIC_API_URL` env var. Do not hardcode.

6. **Three screens only.** Scanner → Review → Confirm. No login, no history view, no settings page. That's out of MVP scope.

7. **Open Food Facts is the food data source.** No API key needed. Barcode → `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

8. **Meal payload** must match exactly what the Calorie Accountant backend expects (see Section 5.1 `MealPayload` interface). The barcode goes in `notes`.

9. **Handle these edge cases:**
   - Barcode scanned but product not in Open Food Facts → show "Product not found" error on scanner screen, allow rescan
   - API POST fails → show error on confirm screen, allow retry without rescanning
   - Nutrition data missing (zero values from OFT) → still allow log, show warning

10. **No authentication** for MVP. The API is assumed to be on a private or trusted network.

---

## 12. Out of MVP Scope

| Feature | Reason |
|---------|--------|
| Manual search by product name | Added complexity, scanner covers most cases |
| Meal history / log viewer | That's the Calorie Accountant's job |
| User accounts / login | Single-user app, no auth needed |
| Photo logging | Different flow entirely |
| Custom food entry | Manual form, no barcode — add later |
| Barcode history / favorites | Nice-to-have, not needed for audit accuracy |
| Offline mode | Requires local cache; adds complexity |

---

*Ledger closed. Build it.*
