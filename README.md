# FoodScan

PWA barcode scanner + AI photo estimation for food logging. Logs meals to the [Calorie Accountant](https://github.com/andrepaim/calorie-accountant) backend.

## What it does

- **Scan barcode** → Open Food Facts lookup → log macros
- **Take a photo** → Claude AI estimates nutrition → log macros
- Links to static training/mobility reference pages

## Stack

- Vite 5 + React 18 + TypeScript
- react-router-dom v6
- Zustand v5
- Tailwind CSS v3 (NativeWind-style mobile-first)
- @zxing/library (barcode scanning)
- vite-plugin-pwa (installable PWA)

## Live

**https://foodscan.duckdns.org**

## Project structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts        # Calorie Accountant API (req<T>() pattern)
│   │   ├── foodfacts.ts     # Open Food Facts wrapper
│   │   └── estimation.ts    # Photo → AI estimation API client
│   ├── stores/
│   │   └── scanStore.ts     # Zustand store (product, serving, macros)
│   ├── pages/
│   │   ├── Home.tsx         # Entry point — scan / photo / reference links
│   │   ├── Scanner.tsx      # Full-screen barcode scanner
│   │   ├── Review.tsx       # Product review + serving size adjustment
│   │   └── Confirm.tsx      # Summary + POST /meals
│   └── components/
│       ├── MacroRow.tsx
│       ├── MealTypeSelector.tsx
│       ├── ServingInput.tsx
│       └── PhotoCapture.tsx
└── public/
    └── pwa-*.png / apple-touch-icon.png / favicon.png
```

## Backend dependency

Requires the Calorie Accountant FastAPI backend running at `VITE_API_URL` (defaults to `http://localhost:3201`).

The backend also serves this frontend's `dist/` as static files — same-origin architecture, no CORS needed.

## Deploy

```bash
bash deploy.sh
```

Builds frontend, rsyncs to `/root/calorie-accountant/frontend/dist/`, restarts the backend service. Preserves static HTML pages added by other agents.

## Photo estimation

`POST /estimate/photo` on the backend calls Claude CLI (`claude --print`) as a subprocess with a temp image file path. No Anthropic API key needed — uses the Claude Max subscription authenticated on the VPS.
