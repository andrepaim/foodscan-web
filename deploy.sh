#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST=/root/calorie-accountant/frontend/dist

cd "$SCRIPT_DIR/frontend"
echo "Building FoodScan..."
npm run build

echo "Deploying to $DIST (preserving static HTML pages)..."

# Copy built assets — rsync excludes .html files not in our build
# so static pages added by other bots survive
rsync -a --exclude="*.html" dist/ "$DIST/"

# Copy only our index.html (overwrite)
cp dist/index.html "$DIST/index.html"

# Copy any .html files from our build that don't already exist in dist
# (won't overwrite workouts.html, mobility-exercises.html, etc.)
for f in dist/*.html; do
  fname=$(basename "$f")
  if [ "$fname" = "index.html" ]; then continue; fi
  if [ ! -f "$DIST/$fname" ]; then
    cp "$f" "$DIST/$fname"
  fi
done

chmod -R 755 "$DIST/"
find "$DIST/" -type f -exec chmod 644 {} \;

systemctl restart calorie-accountant
echo "Done → https://foodscan.duckdns.org"
