#!/bin/sh
# Runs every *.test.js for this subject with JavaScriptCore.
# The shared engine has its own suite: ../shared/vocab/tests/run.sh
set -e
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
cd "$(dirname "$0")/.."
status=0
for t in tests/*.test.js; do
  echo "--- $t"
  "$JSC" "$t" || status=1
done
exit $status
