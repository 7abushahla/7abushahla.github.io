#!/usr/bin/env bash
# Render _figures/<slug>.html (a 600x375 page) to images/fig-<slug>.png at 1200x750.
set -euo pipefail
cd "$(dirname "$0")/.."
slug="${1:?usage: _tools/render-figure.sh <slug>}"
src="$PWD/_figures/$slug.html"
out="$PWD/images/fig-$slug.png"
[ -f "$src" ] || { echo "no such figure: $src" >&2; exit 1; }
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --screenshot="$out" --window-size=600,375 --force-device-scale-factor=2 \
  --hide-scrollbars --virtual-time-budget=6000 "file://$src" >/dev/null 2>&1
sips -g pixelWidth -g pixelHeight "$out" | awk '/pixel/ {print $1, $2}'
