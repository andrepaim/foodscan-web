# CLAUDE.md — FoodScan

## Architecture

Frontend-only PWA served by the Calorie Accountant FastAPI backend. Same-origin: API calls use relative paths (`/meals`, `/estimate/photo`), no CORS.

**Backend repo:** `/root/calorie-accountant/`
**Frontend dist deployed to:** `/root/calorie-accountant/frontend/dist/`
**Live URL:** https://foodscan.duckdns.org

## Key patterns

- `api/client.ts` — single `req<T>(method, path, body?)` function, same as distillpod
- `stores/scanStore.ts` — single Zustand store, `computedMacros()` scales per100g by serving ratio
- All navigation flows through the store: scan/photo → `setProduct()` → `/review` → `/confirm`

## Deploy

```bash
bash deploy.sh
```

Uses `rsync --exclude="*.html"` to preserve static HTML pages deployed by the Calorie Accountant bot (`/treinos`, `/mobilidade`). Never use plain `cp -r dist/.` — it wipes those pages.

## Photo estimation

- Frontend: `PhotoCapture.tsx` → `estimateFromPhoto()` in `api/estimation.ts` → `POST /estimate/photo`
- Backend: `routers/estimation.py` → `services/claude_vision.py`
- Claude CLI subprocess: `sudo -u andrepaim /home/andrepaim/.local/bin/claude --print <prompt_with_image_path>`
- Image written to `/tmp/foodscan_<uuid>.jpg`, deleted after response
- Always deleted in `finally` block

## Static pages (not part of Vite build)

| URL | File | Owner |
|-----|------|-------|
| `/treinos` | `dist/workouts.html` | Calorie Accountant bot |
| `/mobilidade` | `dist/mobility-exercises.html` | Calorie Accountant bot |

Service worker excludes these via `navigateFallbackDenylist` in `vite.config.ts`.

## PWA icons

Generated from `/tmp/foodscan-icon.svg` using `cairosvg`. To regenerate:
```bash
python3 -c "
import cairosvg
for size, path in [(512,'frontend/public/pwa-512x512.png'),(192,'frontend/public/pwa-192x192.png'),(180,'frontend/public/apple-touch-icon.png'),(32,'frontend/public/favicon.png')]:
    cairosvg.svg2png(url='/tmp/foodscan-icon.svg', write_to=path, output_width=size, output_height=size)
"
```

## Known issues / gotchas

- Android 14/15 Chrome: `capture="environment"` + `accept="image/*"` opens gallery. Fix: use `capture` alone (no accept) on the camera input.
- PWA service worker needs hard refresh / clear site data to update after deploy.
- `sudo -u andrepaim claude` fails if run from a directory andrepaim can't access — always use `cwd="/tmp"`.
