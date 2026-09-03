#!/bin/sh
# Runs every *.test.js under tests/ with JavaScriptCore.
set -e
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
cd "$(dirname "$0")/.."
status=0
for t in tests/*.test.js; do
  echo "--- $t"
  "$JSC" "$t" || status=1
done
exit $status
