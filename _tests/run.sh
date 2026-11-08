#!/usr/bin/env bash
# Build the site, serve _site locally, and run the browser tests against it.
# Uses RVM Ruby 3.2 with gems in vendor/bundle (Ruby 3.4 lacks csv for Jekyll 3.9).
set -euo pipefail
cd "$(dirname "$0")/.."

RUBY_BIN="$HOME/.rvm/rubies/ruby-3.2.0/bin"
export GEM_HOME="$PWD/vendor/bundle/ruby/3.2.0"
export GEM_PATH="$GEM_HOME"
export PATH="$RUBY_BIN:$GEM_HOME/bin:$PATH"

bundle _2.6.6_ exec jekyll build --quiet

PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')
python3 -m http.server "$PORT" --bind 127.0.0.1 -d _site >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT

for _ in $(seq 1 50); do
  curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
  sleep 0.1
done

export SITE_URL="http://127.0.0.1:$PORT"
node --test "_tests/*.test.mjs"
