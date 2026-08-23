#!/bin/sh
# Builds a scratch project two ways and checks both stylesheets are inlined.
set -e
cd "$(dirname "$0")/../.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# A project whose styles.txt names two files, one of them outside src/.
mkdir -p "$tmp/proj/src" "$tmp/outside"
printf 'body { color: red; }\n' > "$tmp/proj/src/app.css"
printf '.shared { color: blue; }\n' > "$tmp/outside/shared.css"
printf '# comment\napp.css\n\n../../outside/shared.css\n' > "$tmp/proj/src/styles.txt"
printf 'globalThis.OK = 1;\n' > "$tmp/proj/src/app.js"
printf 'app.js\n' > "$tmp/proj/src/manifest.txt"
printf '<html><style>{{CSS}}</style><script>{{JS}}</script></html>\n' > "$tmp/proj/src/app.html"

python3 tools/build.py "$tmp/proj" > /dev/null
grep -q 'color: red' "$tmp/proj/index.html" || { echo "FAIL: app.css missing"; exit 1; }
grep -q 'color: blue' "$tmp/proj/index.html" || { echo "FAIL: shared.css missing"; exit 1; }
grep -q 'globalThis.OK' "$tmp/proj/index.html" || { echo "FAIL: js missing"; exit 1; }

# A project with no styles.txt still builds from app.css alone.
mkdir -p "$tmp/plain/src"
printf 'body { color: green; }\n' > "$tmp/plain/src/app.css"
printf '' > "$tmp/plain/src/manifest.txt"
printf '<html><style>{{CSS}}</style><script>{{JS}}</script></html>\n' > "$tmp/plain/src/app.html"
python3 tools/build.py "$tmp/plain" > /dev/null
grep -q 'color: green' "$tmp/plain/index.html" || { echo "FAIL: default app.css missing"; exit 1; }

echo "build.test.sh: passed"
