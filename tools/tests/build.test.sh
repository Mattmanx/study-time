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

# A manifest line of the form `NAME = file.json` binds the data to a global.
mkdir -p "$tmp/data/src"
printf 'body { color: teal; }\n' > "$tmp/data/src/app.css"
printf '{"greeting": "\xc2\xbfC\xc3\xb3mo est\xc3\xa1s?", "tag": "a </script> b"}\n' \
  > "$tmp/data/src/data.json"
printf '# comment\nSUBJECT = data.json\n' > "$tmp/data/src/manifest.txt"
printf '<html><style>{{CSS}}</style><script>{{JS}}</script></html>\n' > "$tmp/data/src/app.html"
python3 tools/build.py "$tmp/data" > /dev/null
grep -q 'globalThis.SUBJECT =' "$tmp/data/index.html" || { echo "FAIL: json not bound to a global"; exit 1; }
grep -q '¿Cómo estás?' "$tmp/data/index.html" || { echo "FAIL: non-ASCII value not inlined as itself"; exit 1; }
grep -q '\\u003c/script>' "$tmp/data/index.html" || { echo "FAIL: < not escaped"; exit 1; }
if grep -q 'a </script> b' "$tmp/data/index.html"; then
  echo "FAIL: literal </script> can break out"; exit 1
fi

# Malformed JSON must fail the build rather than ship unparseable data.
printf '{"greeting": "unclosed\n' > "$tmp/data/src/data.json"
if python3 tools/build.py "$tmp/data" > /dev/null 2>"$tmp/err"; then
  echo "FAIL: malformed JSON did not fail the build"; exit 1
fi
grep -q 'data.json' "$tmp/err" || { echo "FAIL: error does not name the file"; exit 1; }

echo "build.test.sh: passed"
