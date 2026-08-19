# Geometry Algebra Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A landing page linking to per-topic study tools, plus the first tool — an interactive step-by-step quiz covering the Geometry Test #1 algebra review material.

**Architecture:** Each tool is a single generated `index.html` built by inlining a `src/` directory, so it opens by double-click with no server and works offline. Logic modules touch no DOM and are unit-tested under JavaScriptCore; one `views.js` per tool owns all rendering. Multi-step problems carry an authored step chain as data, and a guard test walks every chain to prove it reaches the declared answer.

**Tech Stack:** Plain ES5-style JavaScript in IIFE modules, no framework, no dependencies. Python 3 for the build script. JavaScriptCore (`jsc`, ships with macOS) as the test runner. Inline SVG for graphs.

## Global Constraints

- **The repository is public. No student names in any tracked file** — not in paths, page copy, README, comments, or commit messages. Use grade labels only.
- **`**/reference/` is gitignored and must stay that way.** Run `git check-ignore -v <path>` before committing anything near it.
- **Everything works offline by double-click.** No servers, no CDNs, no `fetch`, no network of any kind. Relative links only, so they resolve under `file://`.
- **`index.html` files are generated. Never hand-edit them** — edit `src/` and rebuild.
- **Module style:** each module is an IIFE, uses `var` rather than `let`/`const`, and exports by assigning to `globalThis` at the end of the IIFE.
- **Test style:** `load('tests/helpers.js'); load('src/x.js');` then `check(label, actual, expected)` calls, ending with `done('suite name')`.
- **Test runner path:** `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`. There is no Node on this machine — do not write tests that need it.
- **All 35 problems are verified against the teacher's answer keys.** Do not "correct" a problem's data against your own arithmetic without re-reading the key PDFs in `geometry-10/reference/`.
- Every task ends with `./tests/run.sh` passing (from Task 2 onward) and a commit.
- **Red phase:** `jsc`'s `load()` aborts on a missing file, so before the first failing run, create the module as an empty file (`: > geometry-10/src/<name>.js`). Otherwise the run fails with `Could not open file` and never executes the test body — which proves the file is absent, not that the behaviour is unimplemented.

---

### Task 1: Shared build tool and landing page

**Files:**
- Create: `tools/build.py`
- Create: `src/app.html`, `src/app.css`, `src/manifest.txt`
- Create: `index.html` (generated — by running the build, not by hand)
- Create: `geometry-10/src/manifest.txt` (empty placeholder so Task 2's build works)

**Interfaces:**
- Consumes: nothing.
- Produces: `python3 tools/build.py <dir>` reads `<dir>/src/manifest.txt` (one JS filename per line, order significant, blank lines and `#` comments ignored), concatenates those files, and substitutes `{{JS}}` and `{{CSS}}` in `<dir>/src/app.html`, writing `<dir>/index.html`. A manifest with no JS files yields an empty `{{JS}}` block.

- [ ] **Step 1: Write the build script**

`tools/build.py`:

```python
"""Inline a project's src/ into a single self-contained index.html.

Usage: python3 tools/build.py <project-dir>
  <project-dir> holds src/app.html, src/app.css, src/manifest.txt
"""
import os
import sys


def read_manifest(src):
    path = os.path.join(src, "manifest.txt")
    if not os.path.exists(path):
        return []
    names = []
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"):
                names.append(line)
    return names


def read(src, name):
    with open(os.path.join(src, name)) as fh:
        return fh.read()


def build(project):
    src = os.path.join(project, "src")
    js = "\n".join(read(src, name) for name in read_manifest(src))
    html = read(src, "app.html")
    for token, value in (("{{CSS}}", read(src, "app.css")), ("{{JS}}", js)):
        assert token in html, "missing %s in %s/app.html" % (token, src)
        html = html.replace(token, value)
    assert "{{" not in html, "unreplaced template token remains"
    out = os.path.join(project, "index.html")
    with open(out, "w") as fh:
        fh.write(html)
    print("wrote %s (%.1f KB)" % (out, os.path.getsize(out) / 1024.0))


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ".")
```

- [ ] **Step 2: Create the landing page source**

`src/manifest.txt` — the landing page needs no JavaScript:

```
# No JS: the landing page is static links.
```

`src/app.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Study Time</title>
<style>{{CSS}}</style>
</head>
<body>
<h1>Study Time</h1>

<section>
  <h2>10th Grade</h2>
  <ul class="topics">
    <li><a href="geometry-10/index.html">
      <strong>Geometry — Test #1: Algebra Review</strong>
      <span>Coordinate plane, equations, fractions, radicals, exponents</span>
    </a></li>
  </ul>
</section>

<section>
  <h2>8th Grade</h2>
  <p class="empty">No study guides yet.</p>
</section>
<script>{{JS}}</script>
</body>
</html>
```

`src/app.css`:

```css
:root { color-scheme: light dark; }
body {
  font: 16px/1.5 system-ui, -apple-system, sans-serif;
  max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem;
}
h1 { font-size: 1.75rem; margin-bottom: 2rem; }
h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: .08em;
     opacity: .6; margin-top: 2rem; }
.topics { list-style: none; padding: 0; }
.topics a {
  display: block; padding: 1rem; border: 1px solid currentColor;
  border-radius: .5rem; text-decoration: none; color: inherit;
}
.topics a:hover { background: rgba(128,128,128,.12); }
.topics span { display: block; font-size: .875rem; opacity: .7; margin-top: .25rem; }
.empty { opacity: .6; font-style: italic; }
```

- [ ] **Step 3: Create the placeholder manifest for the app**

```bash
mkdir -p geometry-10/src geometry-10/tests
printf '# JS modules, in load order. Filled in by later tasks.\n' > geometry-10/src/manifest.txt
```

- [ ] **Step 4: Build and verify the landing page**

Run:

```bash
python3 tools/build.py .
grep -c '{{' index.html
```

Expected: `wrote ./index.html (...)` then `0` — no unreplaced tokens. Open `index.html` and confirm both grade headings render and the Geometry link is present. The link will 404 until Task 10; that is expected.

- [ ] **Step 5: Commit**

```bash
git add tools/build.py src/ index.html geometry-10/src/manifest.txt
git commit -m "Add shared build script and landing page

The build inlines a project's src/ into a single index.html so each study
tool opens by double-click with no server. Landing page groups topics by
grade and links out with relative paths."
```

---

### Task 2: Answer checking

**Files:**
- Create: `geometry-10/src/checker.js`
- Create: `geometry-10/tests/helpers.js`, `geometry-10/tests/run.sh`
- Test: `geometry-10/tests/checker.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `checkAnswer(text, spec)` returning `{ status: string }`. Status is one of `'correct'`, `'unreduced'` (right value, not fully simplified — the caller must NOT count this as an attempt), `'needs-hundredths'`, `'needs-exact'`, `'malformed'`, `'wrong'`.

  Spec shapes, one per answer kind:
  - `{ kind: 'int', value: 16 }`
  - `{ kind: 'fraction', num: 27, den: 20 }`
  - `{ kind: 'pair', x: -4, y: 0 }`
  - `{ kind: 'decimal2', value: 15.81 }`
  - `{ kind: 'radical', coef: 5, rad: 10 }`
  - `{ kind: 'signs', x: '+', y: '-' }`
  - `{ kind: 'label', value: 'x-axis' }`

  Also exports:
  - `gcd(a, b)` and `parseFraction(text)` (returns `{num, den}` or `null`), used by `hints.js` in Task 6.
  - `blankSpec(value)` → the checker spec for a single step blank, inferred from the blank's declared value. This is how an individual blank gets graded: a number becomes `int`, `'27/20'` becomes `fraction`, `'(-4,0)'` becomes `pair`, `'5√10'` becomes `radical`, `'15.81'` becomes `decimal2`, `'-,+'` becomes `signs`, and anything else becomes `label`. Keeping it inferred means problem data stays plain values instead of every blank carrying a type tag.

- [ ] **Step 1: Create the test harness**

`geometry-10/tests/helpers.js`:

```javascript
globalThis.__results = { pass: 0, fail: 0 };

globalThis.check = function (label, actual, expected) {
  if (actual === expected) {
    __results.pass += 1;
  } else {
    __results.fail += 1;
    print("FAIL  " + label + "\n      expected " + expected + ", got " + actual);
  }
};

globalThis.done = function (suite) {
  print(suite + ": " + __results.pass + " passed, " + __results.fail + " failed");
  if (__results.fail > 0) throw new Error(suite + " had failures");
};
```

`geometry-10/tests/run.sh` (then `chmod +x geometry-10/tests/run.sh`):

```sh
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
```

- [ ] **Step 2: Write the failing test**

`geometry-10/tests/checker.test.js`:

```javascript
load('tests/helpers.js');
load('src/checker.js');

function st(text, spec) { return checkAnswer(text, spec).status; }

// --- integers
var INT = { kind: 'int', value: 16 };
check('int exact', st('16', INT), 'correct');
check('int spaced', st('  16 ', INT), 'correct');
check('int wrong', st('15', INT), 'wrong');
check('int garbage', st('abc', INT), 'malformed');
check('int empty', st('', INT), 'malformed');
var NEG = { kind: 'int', value: -14 };
check('int negative', st('-14', NEG), 'correct');
check('int unicode minus', st('−14', NEG), 'correct');
// Zero must not be confused with blank -- P1 #7 and P2 #9 both answer 0.
var ZERO = { kind: 'int', value: 0 };
check('int zero', st('0', ZERO), 'correct');
check('int zero vs blank', st('', ZERO), 'malformed');

// --- fractions: right value but unreduced is its own status, not "wrong"
var FR = { kind: 'fraction', num: 6, den: 5 };
check('frac exact', st('6/5', FR), 'correct');
check('frac unreduced', st('108/90', FR), 'unreduced');
check('frac wrong', st('5/6', FR), 'wrong');
check('frac malformed', st('6/', FR), 'malformed');
check('frac div by zero', st('6/0', FR), 'malformed');
// A whole number answer expressed as a fraction is still correct.
var FR1 = { kind: 'fraction', num: 3, den: 1 };
check('frac whole as int', st('3', FR1), 'correct');
check('frac whole as frac', st('3/1', FR1), 'correct');
check('frac negative', st('-3/7', { kind: 'fraction', num: -3, den: 7 }), 'correct');

// --- ordered pairs
var PAIR = { kind: 'pair', x: -4, y: 0 };
check('pair parens', st('(-4,0)', PAIR), 'correct');
check('pair spaced', st('( -4 , 0 )', PAIR), 'correct');
check('pair bare', st('-4,0', PAIR), 'correct');
check('pair swapped', st('(0,-4)', PAIR), 'wrong');
check('pair malformed', st('-4', PAIR), 'malformed');

// --- decimals: exactly hundredths (type 7)
var DEC = { kind: 'decimal2', value: 15.81 };
check('dec exact', st('15.81', DEC), 'correct');
check('dec too coarse', st('15.8', DEC), 'needs-hundredths');
check('dec integer', st('15', DEC), 'needs-hundredths');
check('dec too fine', st('15.811', DEC), 'needs-hundredths');
check('dec wrong', st('15.82', DEC), 'wrong');
check('dec trailing zero ok', st('10.49', { kind: 'decimal2', value: 10.49 }), 'correct');

// --- radicals: exact only (type 8)
var RAD = { kind: 'radical', coef: 5, rad: 10 };
check('rad unicode', st('5√10', RAD), 'correct');
check('rad sqrt word', st('5 sqrt 10', RAD), 'correct');
check('rad r form', st('5r10', RAD), 'correct');
check('rad decimal rejected', st('15.81', RAD), 'needs-exact');
check('rad unsimplified', st('√250', RAD), 'wrong');
check('rad wrong', st('5√11', RAD), 'wrong');
// Coefficient 1 is written bare: sqrt(14) not 1*sqrt(14). Accept both.
var RAD1 = { kind: 'radical', coef: 1, rad: 14 };
check('rad implicit one', st('√14', RAD1), 'correct');
check('rad explicit one', st('1√14', RAD1), 'correct');

// --- quadrant signs
var SIGNS = { kind: 'signs', x: '-', y: '+' };
check('signs plain', st('-,+', SIGNS), 'correct');
check('signs parens', st('( -, + )', SIGNS), 'correct');
check('signs wrong', st('+,-', SIGNS), 'wrong');

// --- labels
var LAB = { kind: 'label', value: 'x-axis' };
check('label exact', st('x-axis', LAB), 'correct');
check('label case', st('X-Axis', LAB), 'correct');
check('label spaces', st('x axis', LAB), 'correct');
check('label wrong', st('y-axis', LAB), 'wrong');

// --- blankSpec infers a grading rule from a blank's declared value
check('spec number', blankSpec(-144).kind, 'int');
check('spec number value', blankSpec(-144).value, -144);
check('spec fraction', blankSpec('27/20').kind, 'fraction');
check('spec fraction num', blankSpec('27/20').num, 27);
check('spec pair', blankSpec('(-4,0)').kind, 'pair');
check('spec pair x', blankSpec('(-4,0)').x, -4);
check('spec radical', blankSpec('5√10').kind, 'radical');
check('spec radical rad', blankSpec('5√10').rad, 10);
check('spec decimal', blankSpec('15.81').kind, 'decimal2');
check('spec signs', blankSpec('-,+').kind, 'signs');
check('spec signs x', blankSpec('-,+').x, '-');
check('spec label', blankSpec('x-axis').kind, 'label');
check('spec label quadrant', blankSpec('quadrant II').kind, 'label');
// Round trip: a blank's own declared value must grade as correct.
check('spec round trip int', checkAnswer('-144', blankSpec(-144)).status, 'correct');
check('spec round trip frac', checkAnswer('27/20', blankSpec('27/20')).status, 'correct');
check('spec round trip pair', checkAnswer('(-4,0)', blankSpec('(-4,0)')).status, 'correct');
check('spec round trip rad', checkAnswer('5√10', blankSpec('5√10')).status, 'correct');

done('checker');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/checker.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: checkAnswer`.

- [ ] **Step 4: Write the implementation**

`geometry-10/src/checker.js`:

```javascript
// Answer comparison. One rule per answer kind. No DOM access.
(function () {
  // Students type the unicode minus from a worksheet as often as a hyphen.
  function normalize(text) {
    return String(text == null ? '' : text)
      .replace(/−/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function parseInteger(text) {
    var s = normalize(text);
    return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
  }

  function parseFraction(text) {
    var s = normalize(text);
    var m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) {
      var den = parseInt(m[2], 10);
      if (den === 0) return null;
      return { num: parseInt(m[1], 10), den: den };
    }
    var whole = parseInteger(s);
    return whole === null ? null : { num: whole, den: 1 };
  }

  function isReduced(f) {
    return gcd(f.num, f.den) === 1 && f.den > 0;
  }

  function sameValue(a, b) { return a.num * b.den === b.num * a.den; }

  function parsePair(text) {
    var s = normalize(text).replace(/^\(|\)$/g, '');
    var parts = s.split(',');
    if (parts.length !== 2) return null;
    var x = parseInteger(parts[0]), y = parseInteger(parts[1]);
    return (x === null || y === null) ? null : { x: x, y: y };
  }

  // Type 7 demands exactly two decimal places -- "15.8" is not an answer
  // rounded to hundredths, it is an answer rounded to tenths.
  function checkDecimal2(text, spec) {
    var s = normalize(text);
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return { status: 'malformed' };
    if (!/^[+-]?\d+\.\d{2}$/.test(s)) return { status: 'needs-hundredths' };
    return { status: parseFloat(s) === spec.value ? 'correct' : 'wrong' };
  }

  function parseRadical(text) {
    var s = normalize(text).toLowerCase()
      .replace(/√/g, ' sqrt ')
      .replace(/\bsqrt\b/g, ' sqrt ')
      .replace(/(\d)\s*r\s*(\d)/g, '$1 sqrt $2')
      .replace(/^\s*r\s*(\d)/, ' sqrt $1')
      .replace(/\s+/g, ' ')
      .trim();
    var m = s.match(/^(\d*)\s*sqrt\s*(\d+)$/);
    if (!m) return null;
    return { coef: m[1] === '' ? 1 : parseInt(m[1], 10), rad: parseInt(m[2], 10) };
  }

  function checkRadical(text, spec) {
    var s = normalize(text);
    // A bare decimal means the calculator button was used -- explicitly banned.
    if (/^[+-]?\d+\.\d+$/.test(s)) return { status: 'needs-exact' };
    var r = parseRadical(s);
    if (r === null) return { status: 'malformed' };
    return { status: (r.coef === spec.coef && r.rad === spec.rad) ? 'correct' : 'wrong' };
  }

  function checkSigns(text, spec) {
    var s = normalize(text).replace(/[()\s]/g, '');
    var parts = s.split(',');
    if (parts.length !== 2 || !/^[+-]$/.test(parts[0]) || !/^[+-]$/.test(parts[1])) {
      return { status: 'malformed' };
    }
    return { status: (parts[0] === spec.x && parts[1] === spec.y) ? 'correct' : 'wrong' };
  }

  function checkLabel(text, spec) {
    function key(v) { return normalize(v).toLowerCase().replace(/[\s-]+/g, ''); }
    var s = key(text);
    if (s === '') return { status: 'malformed' };
    return { status: s === key(spec.value) ? 'correct' : 'wrong' };
  }

  function checkAnswer(text, spec) {
    if (spec.kind === 'int') {
      var n = parseInteger(text);
      if (n === null) return { status: 'malformed' };
      return { status: n === spec.value ? 'correct' : 'wrong' };
    }
    if (spec.kind === 'fraction') {
      var f = parseFraction(text);
      if (f === null) return { status: 'malformed' };
      if (!sameValue(f, spec)) return { status: 'wrong' };
      return { status: isReduced(f) ? 'correct' : 'unreduced' };
    }
    if (spec.kind === 'pair') {
      var p = parsePair(text);
      if (p === null) return { status: 'malformed' };
      return { status: (p.x === spec.x && p.y === spec.y) ? 'correct' : 'wrong' };
    }
    if (spec.kind === 'decimal2') return checkDecimal2(text, spec);
    if (spec.kind === 'radical') return checkRadical(text, spec);
    if (spec.kind === 'signs') return checkSigns(text, spec);
    if (spec.kind === 'label') return checkLabel(text, spec);
    throw new Error('unknown answer kind: ' + spec.kind);
  }

  // A step blank declares a plain value; its grading rule is inferred from
  // the shape of that value, so problem data stays free of type tags.
  function blankSpec(value) {
    if (typeof value === 'number') return { kind: 'int', value: value };
    var s = normalize(value);
    if (s.indexOf(',') !== -1) {
      var pr = parsePair(s);
      if (pr) return { kind: 'pair', x: pr.x, y: pr.y };
      var q = s.replace(/[()\s]/g, '').split(',');
      if (q.length === 2 && /^[+-]$/.test(q[0]) && /^[+-]$/.test(q[1])) {
        return { kind: 'signs', x: q[0], y: q[1] };
      }
      return { kind: 'label', value: s };
    }
    var r = parseRadical(s);
    if (r) return { kind: 'radical', coef: r.coef, rad: r.rad };
    if (s.indexOf('/') !== -1) {
      var f = parseFraction(s);
      if (f) return { kind: 'fraction', num: f.num, den: f.den };
    }
    if (/^[+-]?\d+\.\d+$/.test(s)) return { kind: 'decimal2', value: parseFloat(s) };
    if (/^[+-]?\d+$/.test(s)) return { kind: 'int', value: parseInt(s, 10) };
    return { kind: 'label', value: s };
  }

  globalThis.checkAnswer = checkAnswer;
  globalThis.gcd = gcd;
  globalThis.parseFraction = parseFraction;
  globalThis.blankSpec = blankSpec;
})();
```

- [ ] **Step 5: Register the module and run the tests**

Set `geometry-10/src/manifest.txt` to:

```
# JS modules, in load order: data and pure logic before the views that use them.
checker.js
```

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `checker: ... passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add geometry-10/src/checker.js geometry-10/src/manifest.txt geometry-10/tests/
git commit -m "Add answer checking with per-kind comparison rules

An unreduced fraction is its own status rather than 'wrong' -- the value
is right and only the simplification is missing, so the caller can give
a free retry. Type 7 demands exactly two decimal places and type 8
rejects decimals outright, matching the opposed instructions on the
study guides."
```

---

### Task 3: Problem chain walker and the 14 equation problems

**Files:**
- Create: `geometry-10/src/problems.js`
- Test: `geometry-10/tests/problems.test.js`

**Interfaces:**
- Consumes: `checkAnswer` from Task 2.
- Produces: `PROBLEMS` — an array of problem objects. Each has:
  - `id` (unique string), `type` (string), `source` (e.g. `'P1 #7'`), `prompt` (string)
  - `answer` — a checker spec from Task 2
  - `verify(value)` — a function returning `true` when `value` really does solve the printed problem. Receives `answer.value` for `int`/`decimal2`, or the whole `answer` spec for `fraction`/`radical`.
  - `steps` — array of `{ say, template, blanks }`. `template` contains `{name}` tokens; `blanks` maps each name to its correct value (number or string).

  Also exports:
  - `walkProblem(problem)` → `{ ok: boolean, error: string }`, used by the guard test and by later tasks that render a chain.
  - `verifyArg(answer)` → what to hand `verify()`: the bare `value` for `int` and `decimal2` answers, the whole spec for every other kind. Always call `p.verify(verifyArg(p.answer))` rather than guessing.

  A step may declare `blanks: {}`. That is a **display-only step** — it shows a transformation without asking for input. Only the final step is required to have exactly one blank.

  **The final step's single blank must hold the entire answer, not a piece of it.** `walkProblem` grades `String(finalBlank)` against the whole `answer` spec, so a chain ending in `template: '{b}√10', blanks: { b: 5 }` fails — `'5'` is not a radical. Answer kinds with several fields (`radical`, `pair`, `fraction`, `signs`) need a closing step whose blank is the complete written answer: `'5√10'`, `'(0,-2)'`, `'27/20'`, `'-,+'`. That closing step earns its place anyway — it is what the student writes on the test.

**Why `verify` exists:** it is an independent arithmetic check that the transcription from the PDF is right. The step chain could be internally consistent and still describe the wrong problem; `verify` catches that by substituting the answer back into the printed equation.

- [ ] **Step 1: Write the failing test**

`geometry-10/tests/problems.test.js`:

```javascript
load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');

// --- structural rules every problem must satisfy
var seen = {};
var dupes = 0, badTemplate = 0, badWalk = 0, badVerify = 0, badFinal = 0;

for (var i = 0; i < PROBLEMS.length; i++) {
  var p = PROBLEMS[i];
  if (seen[p.id]) dupes += 1;
  seen[p.id] = true;

  // Every {token} in a template has a blank, and every blank is used.
  for (var s = 0; s < p.steps.length; s++) {
    var step = p.steps[s];
    var tokens = (step.template.match(/\{(\w+)\}/g) || [])
                   .map(function (t) { return t.slice(1, -1); });
    var keys = Object.keys(step.blanks);
    if (tokens.length !== keys.length) { badTemplate += 1; continue; }
    for (var t = 0; t < tokens.length; t++) {
      if (!(tokens[t] in step.blanks)) badTemplate += 1;
    }
  }

  // The chain must terminate at the declared answer.
  var w = walkProblem(p);
  if (!w.ok) { badWalk += 1; print('  walk failed: ' + p.id + ' -- ' + w.error); }

  // The declared answer must actually solve the printed problem.
  if (p.verify(verifyArg(p.answer)) !== true) {
    badVerify += 1; print('  verify failed: ' + p.id);
  }
}

check('ids unique', dupes, 0);
check('templates match blanks', badTemplate, 0);
check('chains reach the answer', badWalk, 0);
check('answers solve the printed problem', badVerify, 0);

// --- walkProblem must actually be able to fail, or it proves nothing
var broken = {
  id: 'broken', type: 'equation', source: 'test', prompt: '2n = 4',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return 2 * n === 4; },
  steps: [{ say: 'Divide by 2:', template: 'n = {a}', blanks: { a: 99 } }]
};
check('walker catches a wrong final blank', walkProblem(broken).ok, false);

var twoBlanks = {
  id: 'two', type: 'equation', source: 'test', prompt: '2n = 4',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return 2 * n === 4; },
  steps: [{ say: 'x', template: '{a} = {b}', blanks: { a: 2, b: 2 } }]
};
check('walker rejects a multi-blank final step', walkProblem(twoBlanks).ok, false);

// --- the 14 equations are all present and answer-key-verified
var eq = PROBLEMS.filter(function (p) { return p.type === 'equation'; });
check('equation count', eq.length, 14);

function byId(id) {
  var m = PROBLEMS.filter(function (p) { return p.id === id; });
  return m.length === 1 ? m[0] : null;
}
// Spot-check the answers the teacher's key gives, including the two the
// student got wrong: P1 #7 is zero, P2 #9 is zero.
check('p1-4', byId('p1-4').answer.value, 16);
check('p1-5', byId('p1-5').answer.value, -14);
check('p1-6', byId('p1-6').answer.value, 12);
check('p1-7 is zero', byId('p1-7').answer.value, 0);
check('p1-8', byId('p1-8').answer.value, 1);
check('p1-9', byId('p1-9').answer.value, -6);
check('p2-2', byId('p2-2').answer.value, -15);
check('p2-3', byId('p2-3').answer.value, -12);
check('p2-4', byId('p2-4').answer.value, -8);
check('p2-5', byId('p2-5').answer.value, 15);
check('p2-6', byId('p2-6').answer.value, 6);
check('p2-7', byId('p2-7').answer.value, -2);
check('p2-8', byId('p2-8').answer.value, -5);
check('p2-9 is zero', byId('p2-9').answer.value, 0);

done('problems');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/problems.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: PROBLEMS`.

An empty file still proves nothing is implemented. Without it, `load('src/problems.js')` throws `Could not open file` before the test body runs, which is a missing-file error rather than a missing-implementation one.

- [ ] **Step 3: Write the walker and the equation data**

`geometry-10/src/problems.js`:

```javascript
// The study guide problems, as data. Every answer here is verified against
// the teacher's answer keys -- do not "fix" one against your own arithmetic
// without re-reading the key PDFs in reference/.
(function () {
  // A chain is trustworthy only if its last step lands exactly on the
  // declared answer. Anything else means the transcription drifted.
  function walkProblem(p) {
    if (!p.steps || p.steps.length === 0) {
      return { ok: false, error: 'no steps' };
    }
    var last = p.steps[p.steps.length - 1];
    var keys = Object.keys(last.blanks);
    if (keys.length !== 1) {
      return { ok: false, error: 'final step must have exactly one blank, has ' + keys.length };
    }
    var final = last.blanks[keys[0]];
    var result = checkAnswer(String(final), p.answer);
    if (result.status !== 'correct') {
      return { ok: false, error: 'final blank ' + final + ' is ' + result.status };
    }
    return { ok: true, error: '' };
  }

  // int and decimal2 answers verify against a bare number; every other kind
  // needs the whole spec, since its value lives in several fields.
  function verifyArg(answer) {
    return (answer.kind === 'int' || answer.kind === 'decimal2') ? answer.value : answer;
  }

  var PROBLEMS = [
    // ---- Type 4: multi-step linear equations (Part I #4-9, Part II #2-9)
    { id: 'p1-4', type: 'equation', source: 'P1 #4', prompt: '−9p − 1 = −145',
      answer: { kind: 'int', value: 16 },
      verify: function (p) { return -9 * p - 1 === -145; },
      steps: [
        { say: 'Add 1 to both sides:', template: '−9p = {a}', blanks: { a: -144 } },
        { say: 'Divide both sides by −9:', template: 'p = {b}', blanks: { b: 16 } }
      ] },

    { id: 'p1-5', type: 'equation', source: 'P1 #5', prompt: '−10 + x/14 = −11',
      answer: { kind: 'int', value: -14 },
      verify: function (x) { return -10 + x / 14 === -11; },
      steps: [
        { say: 'Add 10 to both sides:', template: 'x/14 = {a}', blanks: { a: -1 } },
        { say: 'Multiply both sides by 14:', template: 'x = {b}', blanks: { b: -14 } }
      ] },

    { id: 'p1-6', type: 'equation', source: 'P1 #6', prompt: '−(x − 5) = −7',
      answer: { kind: 'int', value: 12 },
      verify: function (x) { return -(x - 5) === -7; },
      steps: [
        { say: 'Distribute the −1:', template: '−x + {a} = −7', blanks: { a: 5 } },
        { say: 'Subtract 5 from both sides:', template: '−x = {b}', blanks: { b: -12 } },
        { say: 'Divide both sides by −1:', template: 'x = {c}', blanks: { c: 12 } }
      ] },

    { id: 'p1-7', type: 'equation', source: 'P1 #7', prompt: '2(n − 7) = −14',
      answer: { kind: 'int', value: 0 },
      verify: function (n) { return 2 * (n - 7) === -14; },
      steps: [
        { say: 'Distribute the 2:', template: '2n − {a} = −14', blanks: { a: 14 } },
        { say: 'Add 14 to both sides:', template: '2n = {b}', blanks: { b: 0 } },
        { say: 'Divide both sides by 2:', template: 'n = {c}', blanks: { c: 0 } }
      ] },

    { id: 'p1-8', type: 'equation', source: 'P1 #8', prompt: '2n + 3 = −4 + 9n',
      answer: { kind: 'int', value: 1 },
      verify: function (n) { return 2 * n + 3 === -4 + 9 * n; },
      steps: [
        { say: 'Subtract 9n from both sides:', template: '{a}n + 3 = −4', blanks: { a: -7 } },
        { say: 'Subtract 3 from both sides:', template: '−7n = {b}', blanks: { b: -7 } },
        { say: 'Divide both sides by −7:', template: 'n = {c}', blanks: { c: 1 } }
      ] },

    { id: 'p1-9', type: 'equation', source: 'P1 #9', prompt: '1 − 7a = −5 − 8a',
      answer: { kind: 'int', value: -6 },
      verify: function (a) { return 1 - 7 * a === -5 - 8 * a; },
      steps: [
        { say: 'Add 8a to both sides:', template: '1 + {a}a = −5', blanks: { a: 1 } },
        { say: 'Subtract 1 from both sides:', template: 'a = {b}', blanks: { b: -6 } }
      ] },

    { id: 'p2-2', type: 'equation', source: 'P2 #2', prompt: '4n + 5 = −55',
      answer: { kind: 'int', value: -15 },
      verify: function (n) { return 4 * n + 5 === -55; },
      steps: [
        { say: 'Subtract 5 from both sides:', template: '4n = {a}', blanks: { a: -60 } },
        { say: 'Divide both sides by 4:', template: 'n = {b}', blanks: { b: -15 } }
      ] },

    { id: 'p2-3', type: 'equation', source: 'P2 #3', prompt: '−1 − 7b = 83',
      answer: { kind: 'int', value: -12 },
      verify: function (b) { return -1 - 7 * b === 83; },
      steps: [
        { say: 'Add 1 to both sides:', template: '−7b = {a}', blanks: { a: 84 } },
        { say: 'Divide both sides by −7:', template: 'b = {b}', blanks: { b: -12 } }
      ] },

    { id: 'p2-4', type: 'equation', source: 'P2 #4', prompt: '1 + b/4 = −1',
      answer: { kind: 'int', value: -8 },
      verify: function (b) { return 1 + b / 4 === -1; },
      steps: [
        { say: 'Subtract 1 from both sides:', template: 'b/4 = {a}', blanks: { a: -2 } },
        { say: 'Multiply both sides by 4:', template: 'b = {b}', blanks: { b: -8 } }
      ] },

    { id: 'p2-5', type: 'equation', source: 'P2 #5', prompt: 'm/5 − 6 = −3',
      answer: { kind: 'int', value: 15 },
      verify: function (m) { return m / 5 - 6 === -3; },
      steps: [
        { say: 'Add 6 to both sides:', template: 'm/5 = {a}', blanks: { a: 3 } },
        { say: 'Multiply both sides by 5:', template: 'm = {b}', blanks: { b: 15 } }
      ] },

    { id: 'p2-6', type: 'equation', source: 'P2 #6', prompt: '6(−8n − 1) = −294',
      answer: { kind: 'int', value: 6 },
      verify: function (n) { return 6 * (-8 * n - 1) === -294; },
      steps: [
        { say: 'Distribute the 6:', template: '{a}n − 6 = −294', blanks: { a: -48 } },
        { say: 'Add 6 to both sides:', template: '−48n = {b}', blanks: { b: -288 } },
        { say: 'Divide both sides by −48:', template: 'n = {c}', blanks: { c: 6 } }
      ] },

    { id: 'p2-7', type: 'equation', source: 'P2 #7', prompt: '−7(6 − 3n) = −84',
      answer: { kind: 'int', value: -2 },
      verify: function (n) { return -7 * (6 - 3 * n) === -84; },
      steps: [
        { say: 'Distribute the −7:', template: '−42 + {a}n = −84', blanks: { a: 21 } },
        { say: 'Add 42 to both sides:', template: '21n = {b}', blanks: { b: -42 } },
        { say: 'Divide both sides by 21:', template: 'n = {c}', blanks: { c: -2 } }
      ] },

    { id: 'p2-8', type: 'equation', source: 'P2 #8', prompt: '3p − 7 = 4p − 2',
      answer: { kind: 'int', value: -5 },
      verify: function (p) { return 3 * p - 7 === 4 * p - 2; },
      steps: [
        { say: 'Subtract 4p from both sides:', template: '{a}p − 7 = −2', blanks: { a: -1 } },
        { say: 'Add 7 to both sides:', template: '−p = {b}', blanks: { b: 5 } },
        { say: 'Divide both sides by −1:', template: 'p = {c}', blanks: { c: -5 } }
      ] },

    // The student subtracted 2x here instead of adding it, and got x = −2.
    { id: 'p2-9', type: 'equation', source: 'P2 #9', prompt: 'x + 7 = −2x + 7',
      answer: { kind: 'int', value: 0 },
      verify: function (x) { return x + 7 === -2 * x + 7; },
      steps: [
        { say: 'Add 2x to both sides:', template: '{a}x + 7 = 7', blanks: { a: 3 } },
        { say: 'Subtract 7 from both sides:', template: '3x = {b}', blanks: { b: 0 } },
        { say: 'Divide both sides by 3:', template: 'x = {c}', blanks: { c: 0 } }
      ] }
  ];

  globalThis.PROBLEMS = PROBLEMS;
  globalThis.walkProblem = walkProblem;
  globalThis.verifyArg = verifyArg;
})();
```

- [ ] **Step 4: Register the module and run the tests**

Add `problems.js` to `geometry-10/src/manifest.txt` after `checker.js`.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `problems: ... passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/problems.js geometry-10/src/manifest.txt geometry-10/tests/problems.test.js
git commit -m "Add step-chain data model and the 14 equation problems

Each problem carries a verify() that substitutes the answer back into the
printed equation, so a transcription error fails the suite instead of
reaching a student. walkProblem separately proves the chain's last blank
is the declared answer, tying chain, answer, and checker together."
```

---

### Task 4: The remaining 21 problems

**Files:**
- Modify: `geometry-10/src/problems.js` (append to the `PROBLEMS` array)
- Modify: `geometry-10/tests/problems.test.js` (append type-count and spot checks)

**Interfaces:**
- Consumes: the `PROBLEMS` shape and `walkProblem` from Task 3. All structural and `verify` checks in Task 3's test loop apply automatically to these new entries — that loop iterates the whole array.
- Produces: `PROBLEMS` grows to 35 entries covering types `evaluate`, `fraction`, `radical-calc`, `radical-exact`, `exponent`.

- [ ] **Step 1: Write the failing test**

Append to `geometry-10/tests/problems.test.js`, immediately before the final `done('problems');` line:

```javascript
// --- the remaining types, all answer-key-verified
check('total count', PROBLEMS.length, 35);
function ofType(t) {
  return PROBLEMS.filter(function (p) { return p.type === t; }).length;
}
check('evaluate count', ofType('evaluate'), 4);
check('fraction count', ofType('fraction'), 4);
check('radical-calc count', ofType('radical-calc'), 4);
check('radical-exact count', ofType('radical-exact'), 3);
check('exponent count', ofType('exponent'), 6);

// The two evaluate problems the student got wrong -- both subtracting a negative.
check('p1-10', byId('p1-10').answer.value, -9);
check('p1-11', byId('p1-11').answer.value, -1);
check('p2-10a', byId('p2-10a').answer.value, -16);
check('p2-10b', byId('p2-10b').answer.value, -78);

check('p1-12 num', byId('p1-12').answer.num, 27);
check('p1-12 den', byId('p1-12').answer.den, 20);
check('p1-13 num', byId('p1-13').answer.num, 6);
check('p1-13 den', byId('p1-13').answer.den, 5);
check('p2-11 num', byId('p2-11').answer.num, 3);
check('p2-12 num', byId('p2-12').answer.num, 4);
check('p2-12 den', byId('p2-12').answer.den, 21);

check('p1-14 decimal', byId('p1-14').answer.value, 15.81);
check('p1-16 coef', byId('p1-16').answer.coef, 5);
check('p1-16 rad', byId('p1-16').answer.rad, 10);
check('p1-17 coef', byId('p1-17').answer.coef, 2);
check('p2-15 rad', byId('p2-15').answer.rad, 21);

// -6^2 is negative but (-17)^2 is positive -- the distinction IS the item.
check('p1-20 is negative', byId('p1-20').answer.value, -36);
check('p1-19 is positive', byId('p1-19').answer.value, 289);
check('p2-17 is negative', byId('p2-17').answer.value, -225);
check('p2-18 is positive', byId('p2-18').answer.value, 576);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `total count expected 35, got 14`.

- [ ] **Step 3: Append the remaining problems**

In `geometry-10/src/problems.js`, insert these entries into the `PROBLEMS` array after the `p2-9` entry (add a comma after `p2-9`'s closing brace):

```javascript
    // ---- Type 5: evaluate at given values (Part I #10-11, Part II #10a-b)
    // Both Part I items were missed the same way: subtracting a negative.
    { id: 'p1-10', type: 'evaluate', source: 'P1 #10',
      prompt: 'p − r + p    when p = −8 and r = −7',
      answer: { kind: 'int', value: -9 },
      verify: function (v) { return (-8) - (-7) + (-8) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(−8) − ({a}) + (−8)', blanks: { a: -7 } },
        { say: 'Subtracting a negative is adding. Rewrite it:', template: '−8 + {b} − 8', blanks: { b: 7 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -9 } }
      ] },

    { id: 'p1-11', type: 'evaluate', source: 'P1 #11',
      prompt: 'y + xy − x    when x = −3 and y = 2',
      answer: { kind: 'int', value: -1 },
      verify: function (v) { return 2 + (-3) * 2 - (-3) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(2) + (−3)(2) − ({a})', blanks: { a: -3 } },
        { say: 'Multiply first:', template: '2 + ({b}) − (−3)', blanks: { b: -6 } },
        { say: 'Subtracting a negative is adding. Rewrite it:', template: '2 − 6 + {c}', blanks: { c: 3 } },
        { say: 'Add left to right:', template: '{d}', blanks: { d: -1 } }
      ] },

    { id: 'p2-10a', type: 'evaluate', source: 'P2 #10a',
      prompt: '−5 + z − y    when y = 7 and z = −4',
      answer: { kind: 'int', value: -16 },
      verify: function (v) { return -5 + (-4) - 7 === v; },
      steps: [
        { say: 'Substitute the values:', template: '−5 + ({a}) − (7)', blanks: { a: -4 } },
        { say: 'Drop the parentheses:', template: '−5 − 4 − {b}', blanks: { b: 7 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -16 } }
      ] },

    { id: 'p2-10b', type: 'evaluate', source: 'P2 #10b',
      prompt: 'r + r(m) + m    when r = 10 and m = −8',
      answer: { kind: 'int', value: -78 },
      verify: function (v) { return 10 + 10 * (-8) + (-8) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(10) + (10)({a}) + (−8)', blanks: { a: -8 } },
        { say: 'Multiply first:', template: '10 + ({b}) − 8', blanks: { b: -80 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -78 } }
      ] },

    // ---- Type 6: multiply or divide fractions, fully simplified
    { id: 'p1-12', type: 'fraction', source: 'P1 #12', prompt: '18/10 · 15/20',
      answer: { kind: 'fraction', num: 27, den: 20 },
      verify: function (f) { return Math.abs((18 / 10) * (15 / 20) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Cancel 18 and 10 by their common factor 2:', template: '{a}/5 · 15/20', blanks: { a: 9 } },
        { say: 'Cancel 15 and 20 by their common factor 5:', template: '9/5 · 3/{b}', blanks: { b: 4 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '27/20' } }
      ] },

    { id: 'p1-13', type: 'fraction', source: 'P1 #13', prompt: '27/10 ÷ 18/8',
      answer: { kind: 'fraction', num: 6, den: 5 },
      verify: function (f) { return Math.abs((27 / 10) / (18 / 8) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Keep, change, flip — turn the divide into a multiply:', template: '27/10 · {a}/18', blanks: { a: 8 } },
        { say: 'Cancel 27 and 18 by 9, then 8 and 10 by 2, and reduce 4/2:', template: '3/5 · {b}/1', blanks: { b: 2 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '6/5' } }
      ] },

    { id: 'p2-11', type: 'fraction', source: 'P2 #11', prompt: '12/22 ÷ 42/33',
      answer: { kind: 'fraction', num: 3, den: 7 },
      verify: function (f) { return Math.abs((12 / 22) / (42 / 33) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Keep, change, flip — turn the divide into a multiply:', template: '12/22 · {a}/42', blanks: { a: 33 } },
        { say: 'Cancel 12 and 22 by 2, and 33 and 42 by 3:', template: '6/11 · 11/{b}', blanks: { b: 14 } },
        { say: 'Cancel the 11s, then 6 and 14 by 2:', template: '3/1 · 1/{c}', blanks: { c: 7 } },
        { say: 'Multiply across:', template: '{d}', blanks: { d: '3/7' } }
      ] },

    { id: 'p2-12', type: 'fraction', source: 'P2 #12', prompt: '4/18 · 30/35',
      answer: { kind: 'fraction', num: 4, den: 21 },
      verify: function (f) { return Math.abs((4 / 18) * (30 / 35) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Cancel 4 and 18 by 2, and 30 and 35 by 5:', template: '2/9 · {a}/7', blanks: { a: 6 } },
        { say: 'Cancel 6 and 9 by their common factor 3:', template: '2/3 · {b}/7', blanks: { b: 2 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '4/21' } }
      ] },

    // ---- Type 7: radicals WITH the calculator, rounded to hundredths
    { id: 'p1-14', type: 'radical-calc', source: 'P1 #14', prompt: '√250',
      answer: { kind: 'decimal2', value: 15.81 },
      verify: function (v) { return Math.abs(Math.sqrt(250) - v) < 0.005; },
      steps: [
        { say: 'Round √250 = 15.8113… to the hundredths place:', template: '{a}', blanks: { a: '15.81' } }
      ] },

    { id: 'p1-15', type: 'radical-calc', source: 'P1 #15', prompt: '√58',
      answer: { kind: 'decimal2', value: 7.62 },
      verify: function (v) { return Math.abs(Math.sqrt(58) - v) < 0.005; },
      steps: [
        { say: 'Round √58 = 7.6157… to the hundredths place:', template: '{a}', blanks: { a: '7.62' } }
      ] },

    { id: 'p2-13', type: 'radical-calc', source: 'P2 #13', prompt: '√35',
      answer: { kind: 'decimal2', value: 5.92 },
      verify: function (v) { return Math.abs(Math.sqrt(35) - v) < 0.005; },
      steps: [
        { say: 'Round √35 = 5.9160… to the hundredths place:', template: '{a}', blanks: { a: '5.92' } }
      ] },

    { id: 'p2-14', type: 'radical-calc', source: 'P2 #14', prompt: '√110',
      answer: { kind: 'decimal2', value: 10.49 },
      verify: function (v) { return Math.abs(Math.sqrt(110) - v) < 0.005; },
      steps: [
        { say: 'Round √110 = 10.4880… to the hundredths place:', template: '{a}', blanks: { a: '10.49' } }
      ] },

    // ---- Type 8a: radicals WITHOUT the calculator -- exact answers only
    { id: 'p1-16', type: 'radical-exact', source: 'P1 #16', prompt: '√250',
      answer: { kind: 'radical', coef: 5, rad: 10 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(250)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 250:', template: '√250 = √({a} · 10)', blanks: { a: 25 } },
        { say: 'Take the square root of 25 out front:', template: '{b}√10', blanks: { b: 5 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '5√10' } }
      ] },

    { id: 'p1-17', type: 'radical-exact', source: 'P1 #17', prompt: '√56',
      answer: { kind: 'radical', coef: 2, rad: 14 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(56)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 56:', template: '√56 = √({a} · 14)', blanks: { a: 4 } },
        { say: 'Take the square root of 4 out front:', template: '{b}√14', blanks: { b: 2 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '2√14' } }
      ] },

    { id: 'p2-15', type: 'radical-exact', source: 'P2 #15', prompt: '√84',
      answer: { kind: 'radical', coef: 2, rad: 21 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(84)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 84:', template: '√84 = √({a} · 21)', blanks: { a: 4 } },
        { say: 'Take the square root of 4 out front:', template: '{b}√21', blanks: { b: 2 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '2√21' } }
      ] },

    // ---- Type 8b: exponents. The minus sign is inside the parentheses or
    // it is not, and that is the whole question.
    { id: 'p1-18', type: 'exponent', source: 'P1 #18', prompt: '18²',
      answer: { kind: 'int', value: 324 },
      verify: function (v) { return 18 * 18 === v; },
      steps: [
        { say: 'Write it as a product:', template: '18 · 18 = {a}', blanks: { a: 324 } }
      ] },

    { id: 'p1-19', type: 'exponent', source: 'P1 #19', prompt: '(−17)²',
      answer: { kind: 'int', value: 289 },
      verify: function (v) { return (-17) * (-17) === v; },
      steps: [
        { say: 'The −17 is inside the parentheses, so both factors are negative:', template: '(−17) · (−17) = {a}', blanks: { a: 289 } }
      ] },

    { id: 'p1-20', type: 'exponent', source: 'P1 #20', prompt: '−6²',
      answer: { kind: 'int', value: -36 },
      verify: function (v) { return -(6 * 6) === v; },
      steps: [
        { say: 'No parentheses, so only the 6 is squared:', template: '−(6 · 6) = {a}', blanks: { a: -36 } }
      ] },

    { id: 'p2-16', type: 'exponent', source: 'P2 #16', prompt: '9²',
      answer: { kind: 'int', value: 81 },
      verify: function (v) { return 9 * 9 === v; },
      steps: [
        { say: 'Write it as a product:', template: '9 · 9 = {a}', blanks: { a: 81 } }
      ] },

    { id: 'p2-17', type: 'exponent', source: 'P2 #17', prompt: '−15²',
      answer: { kind: 'int', value: -225 },
      verify: function (v) { return -(15 * 15) === v; },
      steps: [
        { say: 'No parentheses, so only the 15 is squared:', template: '−(15 · 15) = {a}', blanks: { a: -225 } }
      ] },

    { id: 'p2-18', type: 'exponent', source: 'P2 #18', prompt: '(−24)²',
      answer: { kind: 'int', value: 576 },
      verify: function (v) { return (-24) * (-24) === v; },
      steps: [
        { say: 'The −24 is inside the parentheses, so both factors are negative:', template: '(−24) · (−24) = {a}', blanks: { a: 576 } }
      ] }
```

- [ ] **Step 4: Run the tests**

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `problems: ... passed, 0 failed`. If `verify failed` prints for any id, the transcription is wrong: re-read that item in the key PDF rather than adjusting `verify` to match.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/problems.js geometry-10/tests/problems.test.js
git commit -m "Add the remaining 21 problems: evaluate, fractions, radicals, exponents

Evaluate chains give 'subtracting a negative is adding' its own step,
since that single move accounts for both evaluate errors on the guides.
Fraction chains expose each cancellation as its own blank so a bad
cross-cancel is catchable, and use the key's own keep-change-flip
phrasing."
```

---

### Task 5: Problem generators

**Files:**
- Create: `geometry-10/src/generators.js`
- Test: `geometry-10/tests/generators.test.js`

**Interfaces:**
- Consumes: the problem shape and `walkProblem` from Task 3, `checkAnswer` from Task 2.
- Produces:
  - `makeRng(seed)` → a function returning a float in `[0, 1)`. Deterministic: same seed, same sequence. Used so a reported bad problem can be reproduced.
  - `generate(type, rng)` → a fresh problem object of the given type, in exactly the `PROBLEMS` shape (including `verify` and `steps`).
  - `TYPES` → the array of type strings in study-guide order: `['plane', 'signs', 'intercepts', 'equation', 'evaluate', 'fraction', 'radical-calc', 'radical-exact', 'exponent']`.

  The spec's eight question types become nine here: the spec's type 8 covers both exact radicals and squares of negatives, which need different generators, so they split into `radical-exact` and `exponent`.

Types `plane`, `signs`, and `intercepts` exist only as generated problems — there are no authored ones. Their problem objects carry an extra `figure` field describing what `views.js` must draw:
  - `plane`: `{ shape: 'plane', target: 'x-axis' | 'y-axis' | 'origin' | 'I' | 'II' | 'III' | 'IV' }`
  - `signs`: `{ shape: 'plane', target: 'I' | 'II' | 'III' | 'IV' }`
  - `intercepts`: `{ shape: 'line', xInt: n, yInt: m }` — the line through `(xInt, 0)` and `(0, yInt)`.

- [ ] **Step 1: Write the failing test**

`geometry-10/tests/generators.test.js`:

```javascript
load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');

// --- the rng is deterministic, or seeded replay is worthless
var a = makeRng(42), b = makeRng(42), c = makeRng(43);
var sameSeed = true, diffSeed = false;
for (var i = 0; i < 20; i++) {
  var x = a();
  if (x !== b()) sameSeed = false;
  if (x !== c()) diffSeed = true;
  if (x < 0 || x >= 1) sameSeed = false;
}
check('same seed same sequence', sameSeed, true);
check('different seed differs', diffSeed, true);

// --- every generated problem must survive the same guard the authored ones do
var badWalk = 0, badVerify = 0, badTemplate = 0, missingFigure = 0;
var NEEDS_FIGURE = { plane: 1, signs: 1, intercepts: 1 };

for (var t = 0; t < TYPES.length; t++) {
  var rng = makeRng(1000 + t);
  for (var n = 0; n < 40; n++) {
    var p = generate(TYPES[t], rng);
    if (!walkProblem(p).ok) {
      badWalk += 1; print('  walk failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    if (p.verify(verifyArg(p.answer)) !== true) {
      badVerify += 1; print('  verify failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    for (var s = 0; s < p.steps.length; s++) {
      var toks = (p.steps[s].template.match(/\{(\w+)\}/g) || []).length;
      if (toks !== Object.keys(p.steps[s].blanks).length) badTemplate += 1;
    }
    if (NEEDS_FIGURE[TYPES[t]] && !p.figure) missingFigure += 1;
  }
}
check('generated chains reach their answer', badWalk, 0);
check('generated answers verify', badVerify, 0);
check('generated templates match blanks', badTemplate, 0);
check('graphical types carry a figure', missingFigure, 0);

// --- intercepts must land on integer lattice points inside the drawn grid
var rng2 = makeRng(7), offGrid = 0, degenerate = 0;
for (var k = 0; k < 60; k++) {
  var ip = generate('intercepts', rng2);
  var f = ip.figure;
  if (Math.abs(f.xInt) > 6 || Math.abs(f.yInt) > 6) offGrid += 1;
  // A zero intercept would put both intercepts at the origin, which makes
  // the question meaningless.
  if (f.xInt === 0 || f.yInt === 0) degenerate += 1;
}
check('intercepts stay on the grid', offGrid, 0);
check('no degenerate intercepts', degenerate, 0);

// --- equations must not generate fractional solutions
var rng3 = makeRng(11), nonInteger = 0;
for (var m = 0; m < 100; m++) {
  var eq = generate('equation', rng3);
  if (eq.answer.value !== Math.round(eq.answer.value)) nonInteger += 1;
}
check('equation answers are integers', nonInteger, 0);

// --- radical-exact must never generate an already-simplified radical,
// otherwise the question teaches nothing.
var rng4 = makeRng(13), trivial = 0;
for (var r = 0; r < 60; r++) {
  if (generate('radical-exact', rng4).answer.coef === 1) trivial += 1;
}
check('exact radicals always simplify', trivial, 0);

done('generators');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/generators.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: makeRng`.

An empty file still proves nothing is implemented. Without it, `load('src/generators.js')` throws `Could not open file` before the test body runs, which is a missing-file error rather than a missing-implementation one.

- [ ] **Step 3: Write the implementation**

`geometry-10/src/generators.js`:

```javascript
// Fresh problems in the same shape as the authored ones, so drilling a topic
// cannot decay into memorising the study guide. No DOM access.
(function () {
  var TYPES = ['plane', 'signs', 'intercepts', 'equation', 'evaluate',
               'fraction', 'radical-calc', 'radical-exact', 'exponent'];

  // Mulberry32: small, fast, and deterministic across runs.
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // "Subtract −2a from both sides" is exactly the confusion this tool exists
  // to fix. Say the move the way a teacher would: a negative term is added.
  function undo(n, tail) {
    tail = tail || '';
    return n < 0 ? 'Add ' + (-n) + tail + ' to both sides:'
                 : 'Subtract ' + n + tail + ' from both sides:';
  }

  function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }
  function between(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function nonZero(rng, lo, hi) {
    var v = 0;
    while (v === 0) v = between(rng, lo, hi);
    return v;
  }
  // Worksheets write minus as U+2212, and the app should match.
  function sign(n) { return n < 0 ? '−' + Math.abs(n) : String(n); }
  function plus(n) { return n < 0 ? '− ' + Math.abs(n) : '+ ' + n; }

  function gcdOf(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  var QUADRANTS = [
    { name: 'I', x: '+', y: '+' }, { name: 'II', x: '-', y: '+' },
    { name: 'III', x: '-', y: '-' }, { name: 'IV', x: '+', y: '-' }
  ];

  function genPlane(rng) {
    var targets = ['x-axis', 'y-axis', 'origin', 'I', 'II', 'III', 'IV'];
    var target = pick(rng, targets);
    var isQuad = /^(I|II|III|IV)$/.test(target);
    return {
      id: 'gen-plane-' + target, type: 'plane', source: 'generated',
      prompt: isQuad ? 'Which quadrant is highlighted?' : 'What is the highlighted part called?',
      answer: { kind: 'label', value: isQuad ? 'quadrant ' + target : target },
      figure: { shape: 'plane', target: target },
      verify: function () { return true; },
      steps: [{ say: 'Name the highlighted part:', template: '{a}',
                blanks: { a: isQuad ? 'quadrant ' + target : target } }]
    };
  }

  function genSigns(rng) {
    var q = pick(rng, QUADRANTS);
    return {
      id: 'gen-signs-' + q.name, type: 'signs', source: 'generated',
      prompt: 'In quadrant ' + q.name + ', are x and y positive or negative?',
      answer: { kind: 'signs', x: q.x, y: q.y },
      figure: { shape: 'plane', target: q.name },
      verify: function () { return true; },
      steps: [{ say: 'Give the signs as (x, y):', template: '({a})',
                blanks: { a: q.x + ',' + q.y } }]
    };
  }

  // Both intercepts are asked as whole ordered pairs, which is also how the
  // student got P1 #3b wrong: he gave (−2,0) and (0,−5) for a line whose
  // intercepts are (−5,0) and (0,−2).
  function genIntercepts(rng) {
    var xi = nonZero(rng, -6, 6), yi = nonZero(rng, -6, 6);
    return {
      id: 'gen-int-' + xi + '-' + yi, type: 'intercepts', source: 'generated',
      prompt: 'Name the x- and y-intercepts of the line.',
      answer: { kind: 'pair', x: 0, y: yi },
      figure: { shape: 'line', xInt: xi, yInt: yi },
      verify: function (a) { return a.x === 0 && a.y === yi; },
      steps: [
        { say: 'The x-intercept is where the line crosses the x-axis, so y = 0:',
          template: '{a}', blanks: { a: '(' + xi + ',0)' } },
        { say: 'The y-intercept is where it crosses the y-axis, so x = 0:',
          template: '{b}', blanks: { b: '(0,' + yi + ')' } }
      ]
    };
  }

  // Four shapes, all with integer solutions: ax + b = c, a(x + b) = c,
  // ax + b = cx + d, and x/a + b = c.
  function genEquation(rng) {
    var v = pick(rng, ['n', 'x', 'p', 'b', 'm', 'a']);
    var ans = between(rng, -15, 15);
    var shape = between(rng, 1, 4);

    if (shape === 1) {
      var a = nonZero(rng, -9, 9), b = nonZero(rng, -20, 20);
      var c = a * ans + b;
      return {
        id: 'gen-eq1', type: 'equation', source: 'generated',
        prompt: sign(a) + v + ' ' + plus(b) + ' = ' + sign(c),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a * x + b === c; },
        steps: [
          { say: undo(b), template: sign(a) + v + ' = {p}', blanks: { p: c - b } },
          { say: 'Divide both sides by ' + a + ':', template: v + ' = {q}', blanks: { q: ans } }
        ]
      };
    }
    if (shape === 2) {
      var a2 = nonZero(rng, -8, 8), b2 = nonZero(rng, -12, 12);
      var c2 = a2 * (ans + b2);
      return {
        id: 'gen-eq2', type: 'equation', source: 'generated',
        prompt: sign(a2) + '(' + v + ' ' + plus(b2) + ') = ' + sign(c2),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a2 * (x + b2) === c2; },
        steps: [
          { say: 'Distribute the ' + a2 + ':', template: sign(a2) + v + ' ' + plus(a2 * b2) + ' = ' + sign(c2), blanks: {} },
          { say: undo(a2 * b2), template: sign(a2) + v + ' = {p}', blanks: { p: c2 - a2 * b2 } },
          { say: 'Divide both sides by ' + a2 + ':', template: v + ' = {q}', blanks: { q: ans } }
        ]
      };
    }
    if (shape === 3) {
      var a3 = nonZero(rng, -9, 9), c3 = nonZero(rng, -9, 9);
      while (a3 === c3) c3 = nonZero(rng, -9, 9);
      var b3 = nonZero(rng, -20, 20);
      var d3 = (a3 - c3) * ans + b3;
      return {
        id: 'gen-eq3', type: 'equation', source: 'generated',
        prompt: sign(a3) + v + ' ' + plus(b3) + ' = ' + sign(c3) + v + ' ' + plus(d3),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a3 * x + b3 === c3 * x + d3; },
        steps: [
          { say: 'Move the variable terms together — ' + undo(c3, v).charAt(0).toLowerCase() + undo(c3, v).slice(1),
            template: '{p}' + v + ' ' + plus(b3) + ' = ' + sign(d3), blanks: { p: a3 - c3 } },
          { say: undo(b3),
            template: sign(a3 - c3) + v + ' = {q}', blanks: { q: d3 - b3 } },
          { say: 'Divide both sides by ' + (a3 - c3) + ':', template: v + ' = {r}', blanks: { r: ans } }
        ]
      };
    }
    var d4 = between(rng, 2, 12), b4 = nonZero(rng, -12, 12);
    var c4 = ans / d4 + b4;
    // Keep the division exact by rebuilding the answer as a multiple of d4.
    var ans4 = between(rng, -8, 8) * d4;
    c4 = ans4 / d4 + b4;
    return {
      id: 'gen-eq4', type: 'equation', source: 'generated',
      prompt: v + '/' + d4 + ' ' + plus(b4) + ' = ' + sign(c4),
      answer: { kind: 'int', value: ans4 },
      verify: function (x) { return x / d4 + b4 === c4; },
      steps: [
        { say: undo(b4), template: v + '/' + d4 + ' = {p}', blanks: { p: c4 - b4 } },
        { say: 'Multiply both sides by ' + d4 + ':', template: v + ' = {q}', blanks: { q: ans4 } }
      ]
    };
  }

  // Always includes a subtraction of a negative -- the single move that
  // accounts for both evaluate errors on the guides.
  function genEvaluate(rng) {
    var a = nonZero(rng, -9, 9), b = nonZero(rng, -9, 9);
    var value = a - b + a;
    return {
      id: 'gen-eval', type: 'evaluate', source: 'generated',
      prompt: 'p − r + p    when p = ' + sign(a) + ' and r = ' + sign(b),
      answer: { kind: 'int', value: value },
      verify: function (v) { return a - b + a === v; },
      steps: [
        { say: 'Substitute the values:',
          template: '(' + sign(a) + ') − ({s}) + (' + sign(a) + ')', blanks: { s: b } },
        { say: b < 0 ? 'Subtracting a negative is adding. Rewrite it:' : 'Drop the parentheses:',
          template: sign(a) + ' ' + plus(-b) + ' ' + plus(a), blanks: {} },
        { say: 'Add left to right:', template: '{t}', blanks: { t: value } }
      ]
    };
  }

  // Generated fractions take the multiply-then-simplify route rather than
  // cancelling first, so the bad-cross-cancel detector applies to the
  // authored problems only. That is deliberate: inventing a legal
  // cancellation pair for arbitrary numerators and denominators is a
  // different problem from generating the arithmetic.
  function genFraction(rng) {
    var n1 = between(rng, 2, 12), d1 = between(rng, 2, 12);
    var n2 = between(rng, 2, 12), d2 = between(rng, 2, 12);
    var divide = rng() < 0.5;
    var num = divide ? n1 * d2 : n1 * n2;
    var den = divide ? d1 * n2 : d1 * d2;
    var g = gcdOf(num, den);
    var rn = num / g, rd = den / g;
    var shown = divide ? (n1 + '/' + d1 + ' ÷ ' + n2 + '/' + d2)
                       : (n1 + '/' + d1 + ' · ' + n2 + '/' + d2);
    var steps = [];
    if (divide) {
      steps.push({ say: 'Keep, change, flip — turn the divide into a multiply:',
                   template: n1 + '/' + d1 + ' · {f}/' + n2, blanks: { f: d2 } });
    }
    steps.push({ say: 'Multiply straight across:',
                 template: '{m}/' + den, blanks: { m: num } });
    steps.push({ say: 'Simplify completely:', template: '{r}', blanks: { r: rn + '/' + rd } });
    return {
      id: 'gen-frac', type: 'fraction', source: 'generated', prompt: shown,
      answer: { kind: 'fraction', num: rn, den: rd },
      verify: function (f) { return Math.abs(num / den - f.num / f.den) < 1e-9; },
      steps: steps
    };
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  function genRadicalCalc(rng) {
    var n = between(rng, 20, 200);
    while (Math.sqrt(n) === Math.round(Math.sqrt(n))) n = between(rng, 20, 200);
    var v = round2(Math.sqrt(n));
    return {
      id: 'gen-radc', type: 'radical-calc', source: 'generated', prompt: '√' + n,
      answer: { kind: 'decimal2', value: v },
      verify: function (x) { return Math.abs(Math.sqrt(n) - x) < 0.005; },
      steps: [{ say: 'Round √' + n + ' = ' + Math.sqrt(n).toFixed(4) +
                     '… to the hundredths place:',
                template: '{a}', blanks: { a: v.toFixed(2) } }]
    };
  }

  function genRadicalExact(rng) {
    var coef = between(rng, 2, 7);
    var radicands = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];
    var rad = pick(rng, radicands);
    var n = coef * coef * rad;
    return {
      id: 'gen-rade', type: 'radical-exact', source: 'generated', prompt: '√' + n,
      answer: { kind: 'radical', coef: coef, rad: rad },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(n)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides ' + n + ':',
          template: '√' + n + ' = √({a} · ' + rad + ')', blanks: { a: coef * coef } },
        { say: 'Take the square root of ' + (coef * coef) + ' out front:',
          template: '{b}√' + rad, blanks: { b: coef } },
        { say: 'Write the complete simplified answer:',
          template: '{c}', blanks: { c: coef + '√' + rad } }
      ]
    };
  }

  function genExponent(rng) {
    var base = between(rng, 3, 25);
    var form = between(rng, 1, 3);   // 1: n^2   2: (-n)^2   3: -n^2
    if (form === 1) {
      return {
        id: 'gen-exp1', type: 'exponent', source: 'generated', prompt: base + '²',
        answer: { kind: 'int', value: base * base },
        verify: function (v) { return base * base === v; },
        steps: [{ say: 'Write it as a product:',
                  template: base + ' · ' + base + ' = {a}', blanks: { a: base * base } }]
      };
    }
    if (form === 2) {
      return {
        id: 'gen-exp2', type: 'exponent', source: 'generated', prompt: '(−' + base + ')²',
        answer: { kind: 'int', value: base * base },
        verify: function (v) { return base * base === v; },
        steps: [{ say: 'The −' + base + ' is inside the parentheses, so both factors are negative:',
                  template: '(−' + base + ') · (−' + base + ') = {a}', blanks: { a: base * base } }]
      };
    }
    return {
      id: 'gen-exp3', type: 'exponent', source: 'generated', prompt: '−' + base + '²',
      answer: { kind: 'int', value: -(base * base) },
      verify: function (v) { return -(base * base) === v; },
      steps: [{ say: 'No parentheses, so only the ' + base + ' is squared:',
                template: '−(' + base + ' · ' + base + ') = {a}', blanks: { a: -(base * base) } }]
    };
  }

  var BY_TYPE = {
    'plane': genPlane, 'signs': genSigns, 'intercepts': genIntercepts,
    'equation': genEquation, 'evaluate': genEvaluate, 'fraction': genFraction,
    'radical-calc': genRadicalCalc, 'radical-exact': genRadicalExact,
    'exponent': genExponent
  };

  function generate(type, rng) {
    var fn = BY_TYPE[type];
    if (!fn) throw new Error('unknown problem type: ' + type);
    return fn(rng);
  }

  globalThis.TYPES = TYPES;
  globalThis.makeRng = makeRng;
  globalThis.generate = generate;
})();
```

- [ ] **Step 4: Run the tests**

Add `generators.js` to `geometry-10/src/manifest.txt` after `problems.js`.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `generators: ... passed, 0 failed`.

**If `walk failed` appears for `intercepts`:** `walkProblem` requires the final step's blank to grade as the declared answer. The intercepts chain declares the y-intercept as its answer and asks for it last, as a whole ordered pair. Do not reorder those steps.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/generators.js geometry-10/src/manifest.txt geometry-10/tests/generators.test.js
git commit -m "Add seeded problem generators for all nine types

Generated problems go through the same walk and verify guards as the
authored ones, so a generator that produces an unsolvable or
mis-stepped problem fails the suite. Equation generators rebuild their
constants from the intended answer, which keeps every solution an
integer."
```

---

### Task 6: Misconception hints

**Files:**
- Create: `geometry-10/src/hints.js`
- Test: `geometry-10/tests/hints.test.js`

**Interfaces:**
- Consumes: `blankSpec`, `parseFraction`, `gcd` from Task 2.
- Produces: `hintFor(context)` → a hint string, or `''` when no detector matches.

  `context` is `{ problem, step, blankName, typed }` where `typed` is the raw text the student entered. The five detectors are tried in order; the first match wins. A non-matching wrong answer returns `''` and the caller shows generic feedback.

**These five come from errors actually on the completed guides.** Generic "incorrect" feedback is useless against them, so each detector recognises the specific wrong value and names the misconception.

- [ ] **Step 1: Write the failing test**

`geometry-10/tests/hints.test.js`:

```javascript
load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/hints.js');

function ctx(problem, stepIndex, blankName, typed) {
  return { problem: problem, step: problem.steps[stepIndex],
           blankName: blankName, typed: typed };
}
function find(id) {
  return PROBLEMS.filter(function (p) { return p.id === id; })[0];
}
function has(s, needle) { return s.indexOf(needle) !== -1; }

// --- 1. subtracting a negative (P1 #10: wrote -23 for p - r + p, p=-8, r=-7)
var p10 = find('p1-10');
var h1 = hintFor(ctx(p10, 1, 'b', '-7'));
check('subtract-negative fires', has(h1, 'Subtracting a negative'), true);
check('subtract-negative silent when right', hintFor(ctx(p10, 1, 'b', '7')), '');

// --- 2. zero quotient (P1 #7: reached 2n = 0 then wrote n = 2)
var p7 = find('p1-7');
var h2 = hintFor(ctx(p7, 2, 'c', '2'));
check('zero-quotient fires', has(h2, 'is 0'), true);
check('zero-quotient silent when right', hintFor(ctx(p7, 2, 'c', '0')), '');
// It must not fire when the real answer simply is not zero.
check('zero-quotient silent elsewhere', hintFor(ctx(find('p1-4'), 1, 'b', '9')), '');

// --- 3. moving a negative variable term (P2 #9: subtracted 2x, got x = -2)
var p9 = find('p2-9');
var h3 = hintFor(ctx(p9, 0, 'a', '-1'));
check('negative-term fires', has(h3, 'add'), true);
check('negative-term silent when right', hintFor(ctx(p9, 0, 'a', '3')), '');

// --- 4. bad cross-cancel (P1 #12 and P2 #12, both wrong on the first pass)
var p12 = find('p1-12');
// Correct blank is 9 (18 cancelled with 10 by 2). Cancelling 18 against the
// OTHER numerator 15 by 3 would give 6.
var h4 = hintFor(ctx(p12, 0, 'a', '6'));
check('cross-cancel fires', has(h4, 'top against a bottom'), true);
check('cross-cancel silent when right', hintFor(ctx(p12, 0, 'a', '9')), '');

// --- 5. swapped intercepts (P1 #3b: gave (-2,0) and (0,-5) for (-5,0), (0,-2))
var swapProblem = {
  id: 'swap-test', type: 'intercepts', source: 'test',
  prompt: 'Name the x- and y-intercepts of the line.',
  answer: { kind: 'pair', x: 0, y: -2 },
  figure: { shape: 'line', xInt: -5, yInt: -2 },
  verify: function () { return true; },
  steps: [
    { say: 'x-intercept:', template: '{a}', blanks: { a: '(-5,0)' } },
    { say: 'y-intercept:', template: '{b}', blanks: { b: '(0,-2)' } }
  ]
};
var h5 = hintFor(ctx(swapProblem, 0, 'a', '(-2,0)'));
check('swap fires', has(h5, 'x-intercept has y = 0'), true);
check('swap silent when right', hintFor(ctx(swapProblem, 0, 'a', '(-5,0)')), '');
// A plain misread, not a swap, gets no hint from this detector.
check('swap silent on unrelated wrong', hintFor(ctx(swapProblem, 0, 'a', '(3,0)')), '');

// --- unmatched wrong answers stay silent so the caller can be generic
check('no false positive', hintFor(ctx(find('p1-18'), 0, 'a', '323')), '');

done('hints');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/hints.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: hintFor`.

An empty file still proves nothing is implemented. Without it, `load('src/hints.js')` throws `Could not open file` before the test body runs, which is a missing-file error rather than a missing-implementation one.

- [ ] **Step 3: Write the implementation**

`geometry-10/src/hints.js`:

```javascript
// Targeted feedback for the five misconceptions visible on the completed
// study guides. Each detector recognises a specific wrong value; a wrong
// answer that matches none of them returns '' so the caller stays generic.
(function () {
  function num(text) {
    var s = String(text).replace(/−/g, '-').trim();
    return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
  }

  function correctValue(step, blankName) { return step.blanks[blankName]; }

  // 1. Subtracting a negative. The step's own wording flags it, and the
  //    telltale wrong answer is the sign-flipped correct one.
  function subtractNegative(c) {
    if (!/Subtracting a negative/i.test(c.step.say)) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null || got !== -want) return '';
    return 'Subtracting a negative is the same as adding. ' +
           '− (−' + Math.abs(want) + ') becomes + ' + Math.abs(want) + '.';
  }

  // 2. Dividing zero. He reached 2n = 0 and then wrote n = 2.
  function zeroQuotient(c) {
    if (num(correctValue(c.step, c.blankName)) !== 0) return '';
    var got = num(c.typed);
    if (got === null || got === 0) return '';
    var m = c.step.say.match(/Divide both sides by (−?-?\d+)/);
    if (!m) return '';
    var divisor = Math.abs(num(m[1].replace('−', '-')));
    if (Math.abs(got) !== divisor) return '';
    return '0 divided by ' + divisor + ' is 0, not ' + divisor + '. ' +
           'Zero split any number of ways is still zero.';
  }

  // 3. Moving a negative variable term. Subtracting -2x instead of adding it
  //    turns a coefficient of a+|b| into a-|b|.
  function negativeTermAcross(c) {
    var m = c.step.say.match(/Add (\d+)([a-z]) to both sides/);
    if (!m) return '';
    var moved = parseInt(m[1], 10);
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null) return '';
    if (got !== want - 2 * moved) return '';
    return 'That term is −' + moved + m[2] + ', already negative. ' +
           'To cancel it you add ' + moved + m[2] + ' to both sides, not subtract it.';
  }

  // 4. Cancelling a numerator against another numerator. The step names the
  //    two numbers that may legally cancel; anything else is the error.
  function badCrossCancel(c) {
    var m = c.step.say.match(/Cancel (\d+) and (\d+) by/);
    if (!m) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null || got === want) return '';
    var a = parseInt(m[1], 10);
    // Did they divide the first number by a factor it shares with some other
    // number in the problem, rather than with its own partner?
    if (got <= 0 || a % got !== 0) return '';
    return 'You can only cancel a top against a bottom. ' +
           'Check that the two numbers you cancelled are on opposite sides of a fraction bar.';
  }

  // 5. Swapped intercepts: the pair typed is the OTHER intercept's numbers.
  function swappedIntercepts(c) {
    if (c.problem.type !== 'intercepts') return '';
    var want = String(correctValue(c.step, c.blankName)).replace(/[()\s]/g, '');
    var got = String(c.typed).replace(/[()\s−]/g, function (ch) {
      return ch === '−' ? '-' : '';
    });
    var w = want.split(','), g = got.split(',');
    if (w.length !== 2 || g.length !== 2) return '';
    if (g[0] === w[0] && g[1] === w[1]) return '';
    var f = c.problem.figure;
    var other = (w[1] === '0') ? ['0', String(f.yInt)] : [String(f.xInt), '0'];
    // Only fire when the numbers are right but attached to the wrong axis.
    if (!(g[0] === other[1] && g[1] === other[0]) &&
        !(g[0] === other[0] && g[1] === other[1])) return '';
    return 'Check which axis each one crosses. The x-intercept has y = 0, ' +
           'and the y-intercept has x = 0.';
  }

  var DETECTORS = [subtractNegative, zeroQuotient, negativeTermAcross,
                   badCrossCancel, swappedIntercepts];

  function hintFor(context) {
    for (var i = 0; i < DETECTORS.length; i++) {
      var h = DETECTORS[i](context);
      if (h) return h;
    }
    return '';
  }

  globalThis.hintFor = hintFor;
})();
```

- [ ] **Step 4: Run the tests**

Add `hints.js` to `geometry-10/src/manifest.txt` after `generators.js`.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `hints: ... passed, 0 failed`.

**If a detector fires when it should not,** tighten its guard rather than deleting the test. A hint that appears on a correct answer, or on an unrelated wrong one, teaches a misconception the student did not have.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/hints.js geometry-10/src/manifest.txt geometry-10/tests/hints.test.js
git commit -m "Add detectors for the five misconceptions on the study guides

Each detector recognises the specific wrong value rather than reporting
a generic miss, and returns empty when it does not match so the caller
can stay generic. Tests assert both that each fires on its trigger and
that it stays silent on correct and unrelated-wrong answers."
```

---

### Task 7: Progress storage

**Files:**
- Create: `geometry-10/src/storage.js`
- Test: `geometry-10/tests/storage.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseProgress(json)` → `{ version: 1, mastery: {}, misses: {} }`. Defensive: null, empty, corrupt, wrong-shape, or wrong-version input all yield a fresh empty record rather than throwing.
  - `recordResult(progress, type, problemId, firstTryCorrect)` → a **new** progress object; never mutates the input.
  - `masteryStreak(progress, type)` → the current consecutive-first-try-correct count for that type.
  - `troubleSpots(progress)` → array of `{ type, misses }` sorted most-missed first.
  - `serializeProgress(progress)` → JSON string.
  - `STORAGE_KEY` → `'study-time.geometry-10.progress'`.

  Mastery is four consecutive first-try-correct problems in a type; any miss resets that type's streak to zero.

- [ ] **Step 1: Write the failing test**

`geometry-10/tests/storage.test.js`:

```javascript
load('tests/helpers.js');
load('src/storage.js');

// --- parsing is defensive: bad input never throws
check('null', parseProgress(null).version, 1);
check('empty', parseProgress('').version, 1);
check('corrupt', parseProgress('{not json').version, 1);
check('array', parseProgress('[1,2,3]').version, 1);
check('wrong version', Object.keys(parseProgress('{"version":99,"mastery":{"a":9}}').mastery).length, 0);
check('good', parseProgress('{"version":1,"mastery":{"equation":2},"misses":{}}').mastery.equation, 2);

// --- streaks build and reset
var p = parseProgress(null);
check('empty streak', masteryStreak(p, 'equation'), 0);
p = recordResult(p, 'equation', 'p1-4', true);
p = recordResult(p, 'equation', 'p1-5', true);
check('streak of two', masteryStreak(p, 'equation'), 2);
p = recordResult(p, 'equation', 'p1-6', false);
check('miss resets streak', masteryStreak(p, 'equation'), 0);
p = recordResult(p, 'equation', 'p1-7', true);
check('streak restarts', masteryStreak(p, 'equation'), 1);

// --- streaks are per type, not global
var q = parseProgress(null);
q = recordResult(q, 'equation', 'a', true);
q = recordResult(q, 'fraction', 'b', false);
check('other type untouched', masteryStreak(q, 'equation'), 1);
check('missed type is zero', masteryStreak(q, 'fraction'), 0);

// --- recordResult must not mutate its input
var before = parseProgress(null);
before = recordResult(before, 'equation', 'a', true);
var snapshot = masteryStreak(before, 'equation');
recordResult(before, 'equation', 'b', true);
check('no mutation', masteryStreak(before, 'equation'), snapshot);

// --- trouble spots rank by miss count
var t = parseProgress(null);
t = recordResult(t, 'fraction', 'a', false);
t = recordResult(t, 'fraction', 'b', false);
t = recordResult(t, 'equation', 'c', false);
t = recordResult(t, 'exponent', 'd', true);
var spots = troubleSpots(t);
check('two types missed', spots.length, 2);
check('worst first', spots[0].type, 'fraction');
check('worst count', spots[0].misses, 2);
check('mastered type absent', spots.filter(function (s) {
  return s.type === 'exponent'; }).length, 0);

// --- a serialize/parse round trip preserves everything
var round = parseProgress(serializeProgress(t));
check('round trip misses', round.misses.fraction, 2);
check('round trip mastery', masteryStreak(round, 'equation'), 0);

done('storage');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/storage.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: parseProgress`.

An empty file still proves nothing is implemented. Without it, `load('src/storage.js')` throws `Could not open file` before the test body runs, which is a missing-file error rather than a missing-implementation one.

- [ ] **Step 3: Write the implementation**

`geometry-10/src/storage.js`:

```javascript
// Per-topic mastery streaks and cross-session trouble spots.
// Pure: takes and returns plain objects, never touches localStorage itself.
(function () {
  var VERSION = 1;
  var STORAGE_KEY = 'study-time.geometry-10.progress';

  function empty() { return { version: VERSION, mastery: {}, misses: {} }; }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !(v instanceof Array);
  }

  // Anything unexpected yields a fresh record. A study tool losing history is
  // a nuisance; a study tool refusing to start is a broken evening.
  function parseProgress(json) {
    if (!json) return empty();
    var data;
    try { data = JSON.parse(json); } catch (e) { return empty(); }
    if (!isPlainObject(data)) return empty();
    if (data.version !== VERSION) return empty();
    return {
      version: VERSION,
      mastery: isPlainObject(data.mastery) ? data.mastery : {},
      misses: isPlainObject(data.misses) ? data.misses : {}
    };
  }

  function copy(obj) {
    var out = {};
    for (var k in obj) { if (obj.hasOwnProperty(k)) out[k] = obj[k]; }
    return out;
  }

  function recordResult(progress, type, problemId, firstTryCorrect) {
    var mastery = copy(progress.mastery);
    var misses = copy(progress.misses);
    if (firstTryCorrect) {
      mastery[type] = (mastery[type] || 0) + 1;
    } else {
      mastery[type] = 0;
      misses[type] = (misses[type] || 0) + 1;
    }
    return { version: VERSION, mastery: mastery, misses: misses };
  }

  function masteryStreak(progress, type) { return progress.mastery[type] || 0; }

  function troubleSpots(progress) {
    var out = [];
    for (var type in progress.misses) {
      if (progress.misses.hasOwnProperty(type) && progress.misses[type] > 0) {
        out.push({ type: type, misses: progress.misses[type] });
      }
    }
    out.sort(function (a, b) {
      return b.misses - a.misses || (a.type < b.type ? -1 : 1);
    });
    return out;
  }

  function serializeProgress(progress) { return JSON.stringify(progress); }

  globalThis.STORAGE_KEY = STORAGE_KEY;
  globalThis.parseProgress = parseProgress;
  globalThis.recordResult = recordResult;
  globalThis.masteryStreak = masteryStreak;
  globalThis.troubleSpots = troubleSpots;
  globalThis.serializeProgress = serializeProgress;
})();
```

- [ ] **Step 4: Run the tests**

Add `storage.js` to `geometry-10/src/manifest.txt` after `hints.js`.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `storage: ... passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/storage.js geometry-10/src/manifest.txt geometry-10/tests/storage.test.js
git commit -m "Add mastery streaks and trouble-spot tracking

Parsing is deliberately defensive: corrupt or stale stored data yields a
fresh record instead of throwing, because losing history is a nuisance
while failing to start is a broken study session."
```

---

### Task 8: Session sequencing

**Files:**
- Create: `geometry-10/src/session.js`
- Test: `geometry-10/tests/session.test.js`

**Interfaces:**
- Consumes: `PROBLEMS`, `walkProblem` (Task 3), `generate`, `makeRng`, `TYPES` (Task 5), `checkAnswer`, `blankSpec` (Task 2), `hintFor` (Task 6).
- Produces:
  - `createDrill(type, options)` and `createMockTest(options)`, both returning a session with the same interface:
    - `current()` → `{ problem, stepIndex, blankName, revealed }` or `null` when finished
    - `submit(text)` → `{ status, hint, revealed, advanced, complete }`
    - `progressText()` → e.g. `'Problem 3 · streak 2 of 4'` or `'Question 7 of 20'`
    - `isDone()`, `score()`, `missed()` → array of `{ problem, blankName }`
    - `results()` → array of `{ type, problemId, clean }`, one entry per problem finished. `views.js` replays these into `recordResult` so the stored mastery streak means the same thing as the in-session one.
  - `MASTERY_TARGET` → `4`.
  - `MOCK_MIX` → the mock test composition, proportioned like the study guides.

  `options` accepts `{ rng, problems }` for tests. Default rng is `makeRng` seeded from the clock.

**Attempt rules, from the spec:**
- First wrong answer on a blank → `status: 'wrong'`, a hint if a detector matches, and the same blank is retried.
- Second wrong answer → `status: 'revealed'`, the correct value is shown, and the session advances. A revealed blank scores nothing.
- `status: 'unreduced'` → **does not consume an attempt.** The value is right; only simplification is missing.
- `status: 'malformed'` → does not consume an attempt either; nothing was really answered.
- A problem counts as first-try-correct only if every one of its blanks was right on its first attempt.

- [ ] **Step 1: Write the failing test**

`geometry-10/tests/session.test.js`:

```javascript
load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');
load('src/hints.js');
load('src/storage.js');
load('src/session.js');

function only(id) {
  return PROBLEMS.filter(function (p) { return p.id === id; });
}

// p1-7: 2(n-7) = -14, blanks are 14, 0, 0 across three steps.
function drill7() {
  return createDrill('equation', { problems: only('p1-7'), rng: makeRng(1) });
}

// --- correct answers walk the chain and finish the problem
var d = drill7();
check('starts at step 0', d.current().stepIndex, 0);
check('step 0 correct', d.submit('14').status, 'correct');
check('advanced to step 1', d.current().stepIndex, 1);
check('step 1 correct', d.submit('0').status, 'correct');
check('step 2 correct', d.submit('0').status, 'correct');
check('problem complete', d.submit('14').advanced !== undefined, true);

// --- a wrong answer retries the same blank, then reveals
var d2 = drill7();
var r1 = d2.submit('12');
check('first miss is wrong', r1.status, 'wrong');
check('first miss does not advance', d2.current().stepIndex, 0);
var r2 = d2.submit('11');
check('second miss reveals', r2.status, 'revealed');
check('reveal advances', d2.current().stepIndex, 1);

// --- the zero-quotient hint reaches the student through the session
var d3 = drill7();
d3.submit('14'); d3.submit('0');
var r3 = d3.submit('2');
check('hint delivered', r3.hint.indexOf('is 0') !== -1, true);

// --- unreduced fractions cost nothing
var d4 = createDrill('fraction', { problems: only('p1-12'), rng: makeRng(2) });
d4.submit('9'); d4.submit('4');
var r4 = d4.submit('54/40');
check('unreduced status', r4.status, 'unreduced');
check('unreduced does not advance', r4.advanced, false);
var r5 = d4.submit('135/100');
check('still unreduced, not revealed', r5.status, 'unreduced');
check('accepts the reduced form', d4.submit('27/20').status, 'correct');

// --- malformed input costs nothing either
var d5 = drill7();
check('malformed status', d5.submit('???').status, 'malformed');
check('malformed does not advance', d5.current().stepIndex, 0);
check('still on first attempt', d5.submit('12').status, 'wrong');

// --- a drill ends when the mastery target is reached
var d6 = createDrill('exponent', { rng: makeRng(3) });
var guard = 0;
while (!d6.isDone() && guard < 500) {
  var cur = d6.current();
  d6.submit(String(cur.problem.steps[cur.stepIndex].blanks[cur.blankName]));
  guard += 1;
}
check('drill terminates', d6.isDone(), true);
check('drill did not run away', guard < 500, true);

// --- the mock test covers every type and is the right length
var m = createMockTest({ rng: makeRng(4) });
var total = 0, kinds = {};
for (var i = 0; i < MOCK_MIX.length; i++) {
  total += MOCK_MIX[i].count;
  kinds[MOCK_MIX[i].type] = true;
}
check('mock length', total, 20);
check('mock covers every type', Object.keys(kinds).length, TYPES.length);
check('mock starts undone', m.isDone(), false);

// Answer the whole mock test correctly and confirm a clean sweep.
var g2 = 0;
while (!m.isDone() && g2 < 2000) {
  var c = m.current();
  m.submit(String(c.problem.steps[c.stepIndex].blanks[c.blankName]));
  g2 += 1;
}
check('mock terminates', m.isDone(), true);
check('perfect run has no misses', m.missed().length, 0);
check('perfect score', m.score(), 20);
check('one result per problem', m.results().length, 20);
check('all clean on a perfect run', m.results().filter(function (r) {
  return r.clean; }).length, 20);

done('session');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd geometry-10 && ./tests/run.sh`
First create the module as an empty file, so `load()` has something to open:

```bash
: > geometry-10/src/session.js
```

Then run: `cd geometry-10 && ./tests/run.sh`
Expected: FAIL — `Can't find variable: createDrill`.

An empty file still proves nothing is implemented. Without it, `load('src/session.js')` throws `Could not open file` before the test body runs, which is a missing-file error rather than a missing-implementation one.

- [ ] **Step 3: Write the implementation**

`geometry-10/src/session.js`:

```javascript
// Drill and mock-test sequencing. Owns attempt counting and scoring.
// No DOM access.
(function () {
  var MASTERY_TARGET = 4;

  // Proportioned like the study guides. The real Test #1 has not been seen.
  var MOCK_MIX = [
    { type: 'plane', count: 1 },
    { type: 'signs', count: 1 },
    { type: 'intercepts', count: 2 },
    { type: 'equation', count: 6 },
    { type: 'evaluate', count: 2 },
    { type: 'fraction', count: 2 },
    { type: 'radical-calc', count: 2 },
    { type: 'radical-exact', count: 2 },
    { type: 'exponent', count: 2 }
  ];

  function blankNames(step) { return Object.keys(step.blanks); }

  // Display-only steps carry no blanks and are skipped when advancing.
  function firstAnswerable(problem, from) {
    for (var i = from; i < problem.steps.length; i++) {
      if (blankNames(problem.steps[i]).length > 0) return i;
    }
    return -1;
  }

  function createSession(config) {
    var queue = config.queue;          // array of problem objects
    var isDrill = config.isDrill;
    var type = config.type;
    var nextProblem = config.nextProblem;  // function or null

    var problem = null, stepIndex = -1, blankIdx = 0;
    var attempts = 0, revealed = false;
    var cleanProblem = true;
    var streak = 0, solved = 0, score = 0;
    var missed = [];
    var results = [];
    var done = false;

    function loadNext() {
      var p = queue.length ? queue.shift() : (nextProblem ? nextProblem() : null);
      if (!p) { done = true; problem = null; return; }
      problem = p;
      stepIndex = firstAnswerable(p, 0);
      blankIdx = 0; attempts = 0; revealed = false; cleanProblem = true;
      if (stepIndex === -1) { loadNext(); }
    }

    function currentStep() { return problem.steps[stepIndex]; }
    function currentBlank() { return blankNames(currentStep())[blankIdx]; }

    function finishProblem() {
      solved += 1;
      results.push({ type: problem.type, problemId: problem.id, clean: cleanProblem });
      if (cleanProblem) { score += 1; streak += 1; } else { streak = 0; }
      if (isDrill && streak >= MASTERY_TARGET) { done = true; problem = null; return; }
      loadNext();
    }

    function advanceBlank() {
      attempts = 0; revealed = false;
      var names = blankNames(currentStep());
      if (blankIdx + 1 < names.length) { blankIdx += 1; return; }
      var next = firstAnswerable(problem, stepIndex + 1);
      if (next === -1) { finishProblem(); return; }
      stepIndex = next; blankIdx = 0;
    }

    function submit(text) {
      if (done || problem === null) {
        return { status: 'done', hint: '', revealed: false, advanced: false, complete: true };
      }
      var step = currentStep();
      var name = currentBlank();
      var spec = blankSpec(step.blanks[name]);
      var result = checkAnswer(text, spec);

      // Neither of these is a real attempt: the first has the right value and
      // the second has no value at all.
      if (result.status === 'unreduced' || result.status === 'malformed') {
        return { status: result.status, hint: '', revealed: false,
                 advanced: false, complete: false };
      }

      if (result.status === 'correct') {
        advanceBlank();
        return { status: 'correct', hint: '', revealed: false,
                 advanced: true, complete: done };
      }

      attempts += 1;
      cleanProblem = false;
      if (attempts === 1) {
        var hint = hintFor({ problem: problem, step: step,
                             blankName: name, typed: text });
        return { status: 'wrong', hint: hint, revealed: false,
                 advanced: false, complete: false };
      }
      var shown = String(step.blanks[name]);
      missed.push({ problem: problem, blankName: name });
      advanceBlank();
      return { status: 'revealed', hint: 'The answer is ' + shown + '.',
               revealed: true, advanced: true, complete: done };
    }

    function current() {
      if (done || problem === null) return null;
      return { problem: problem, stepIndex: stepIndex,
               blankName: currentBlank(), revealed: revealed };
    }

    function progressText() {
      if (isDrill) {
        return 'Problem ' + (solved + 1) + ' · streak ' + streak +
               ' of ' + MASTERY_TARGET;
      }
      return 'Question ' + Math.min(solved + 1, config.total) +
             ' of ' + config.total;
    }

    loadNext();

    return {
      current: current, submit: submit, progressText: progressText,
      isDone: function () { return done; },
      score: function () { return score; },
      missed: function () { return missed.slice(); },
      results: function () { return results.slice(); },
      type: function () { return type; }
    };
  }

  function createDrill(type, options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9));
    var authored = opts.problems || PROBLEMS.filter(function (p) {
      return p.type === type;
    });
    // Authored problems first, then generated variants forever, so repeated
    // drilling cannot decay into memorising the study guide.
    return createSession({
      queue: authored.slice(), isDrill: true, type: type,
      nextProblem: function () { return generate(type, rng); }
    });
  }

  function createMockTest(options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9));
    var queue = [];
    for (var i = 0; i < MOCK_MIX.length; i++) {
      for (var n = 0; n < MOCK_MIX[i].count; n++) {
        queue.push(generate(MOCK_MIX[i].type, rng));
      }
    }
    return createSession({
      queue: queue, isDrill: false, type: 'mixed',
      nextProblem: null, total: queue.length
    });
  }

  globalThis.MASTERY_TARGET = MASTERY_TARGET;
  globalThis.MOCK_MIX = MOCK_MIX;
  globalThis.createDrill = createDrill;
  globalThis.createMockTest = createMockTest;
})();
```

- [ ] **Step 4: Run the tests**

Add `session.js` to `geometry-10/src/manifest.txt` after `storage.js`.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — `session: ... passed, 0 failed`.

**If the drill test hits its 500-iteration guard,** `finishProblem` is not ending the session at `MASTERY_TARGET`. Do not raise the guard — it exists to catch exactly that.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/session.js geometry-10/src/manifest.txt geometry-10/tests/session.test.js
git commit -m "Add drill and mock-test sequencing with attempt rules

An unreduced fraction and a malformed entry both cost no attempt: the
first has the right value and only needs simplifying, and the second is
not really an answer. Only a genuinely wrong value burns a try, and the
second one reveals the step and moves on."
```

---

### Task 9: Rendering — step blanks and the app shell

**Files:**
- Create: `geometry-10/src/views.js`
- Create: `geometry-10/src/app.html`, `geometry-10/src/app.css`

**Interfaces:**
- Consumes: everything from Tasks 2–8.
- Produces: `startApp()`, called on load. `views.js` is the only module that touches the DOM.

  Also produces `renderTemplate(template, blanks, activeName, filled)` → an HTML string. Each `{name}` token becomes an `<input>` when `name === activeName`, the already-entered text when `filled[name]` exists (as `{ text, shown }`, where `shown: true` means it was revealed rather than answered), and a dimmed `___` otherwise.

**Rendering rules from the spec:**
- Superscripts are real: `18²`, `(−17)²`, `−6²` must be visually unambiguous, because that distinction *is* the question. Render `²` as a literal character, never as `^2`.
- Minus signs use U+2212 (`−`) to match the worksheets, but the input accepts a plain hyphen.
- The answer input must carry `spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"`, or the browser will autocorrect entries and hand over answers.
- Type 7 problems show a "calculator OK" note; type 8 problems show "no calculator — exact answer".

- [ ] **Step 1: Write the app shell**

`geometry-10/src/app.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Geometry — Test #1: Algebra Review</title>
<style>{{CSS}}</style>
</head>
<body>
<main id="menu-screen">
  <p class="crumb"><a href="../index.html">← All topics</a></p>
  <h1>Test #1: Algebra Review</h1>
  <h2>Drill one topic</h2>
  <ul id="topic-list" class="topics"></ul>
  <h2>Or take a practice test</h2>
  <button id="start-mock" class="primary">Start practice test</button>
  <section id="trouble" hidden>
    <h2>Worth reviewing</h2>
    <ul id="trouble-list"></ul>
  </section>
</main>

<main id="quiz-screen" hidden>
  <p class="crumb"><a href="#" id="back-to-menu">← Menu</a></p>
  <p id="progress"></p>
  <p id="calc-note" class="note" hidden></p>
  <div id="figure"></div>
  <p id="prompt" class="prompt"></p>
  <ol id="steps"></ol>
  <p id="feedback" aria-live="polite"></p>
</main>

<main id="done-screen" hidden>
  <h1 id="done-title"></h1>
  <p id="done-score"></p>
  <section>
    <h2>Review these</h2>
    <ul id="review-list"></ul>
  </section>
  <button id="again" class="primary">Back to menu</button>
</main>
<script>{{JS}}</script>
</body>
</html>
```

`geometry-10/src/app.css`:

```css
:root { color-scheme: light dark; --ok: #1a7f37; --no: #b3261e; }
body {
  font: 16px/1.6 system-ui, -apple-system, sans-serif;
  max-width: 40rem; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;
}
h1 { font-size: 1.5rem; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em;
     opacity: .6; margin-top: 2rem; }
.crumb { font-size: .875rem; }
.crumb a { color: inherit; opacity: .7; }
.topics { list-style: none; padding: 0; }
.topics button {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: .75rem 1rem; margin-bottom: .5rem; font: inherit;
  text-align: left; background: none; color: inherit;
  border: 1px solid currentColor; border-radius: .5rem; cursor: pointer;
}
.topics button:hover { background: rgba(128,128,128,.12); }
.bar { width: 5rem; height: .4rem; border-radius: .2rem;
       background: rgba(128,128,128,.3); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--ok); }
.primary {
  font: inherit; padding: .7rem 1.4rem; border-radius: .5rem;
  border: 1px solid currentColor; background: none; color: inherit;
  cursor: pointer;
}
.prompt { font-size: 1.6rem; margin: .5rem 0 1.5rem; }
.note { font-size: .8rem; padding: .35rem .6rem; border-radius: .3rem;
        background: rgba(128,128,128,.15); display: inline-block; }
#steps { list-style: none; padding: 0; }
#steps li { margin-bottom: 1.1rem; opacity: .35; }
#steps li.active, #steps li.past { opacity: 1; }
.say { font-size: .9rem; opacity: .75; }
.line { font-size: 1.25rem; }
.line input {
  font: inherit; width: 5rem; padding: .1rem .35rem; text-align: center;
  border: 0; border-bottom: 2px solid currentColor; background: none;
  color: inherit; border-radius: 0;
}
.line input:focus { outline: none; border-bottom-color: var(--ok); }
.line .filled { color: var(--ok); font-weight: 600; }
.line .shown { color: var(--no); font-weight: 600; }
.line .todo { opacity: .4; }
#feedback { min-height: 3rem; }
#feedback.bad { color: var(--no); }
#feedback.good { color: var(--ok); }
```

- [ ] **Step 2: Write the view module**

`geometry-10/src/views.js`. This is the only module allowed to touch the DOM.

```javascript
// All DOM rendering. Every other module is DOM-free and unit tested.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(id, on) { el(id).hidden = !on; }

  var LABELS = {
    'plane': 'Label the coordinate plane',
    'signs': 'Signs in each quadrant',
    'intercepts': 'x- and y-intercepts',
    'equation': 'Solve equations',
    'evaluate': 'Evaluate expressions',
    'fraction': 'Multiply and divide fractions',
    'radical-calc': 'Radicals with a calculator',
    'radical-exact': 'Radicals without a calculator',
    'exponent': 'Exponents'
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Blanks before the active one show what was entered; the active one is an
  // input; later ones are dimmed placeholders.
  function renderTemplate(template, blanks, activeName, filled) {
    return template.replace(/\{(\w+)\}/g, function (_, name) {
      if (name === activeName) {
        return '<input id="answer" type="text" inputmode="text" ' +
               'spellcheck="false" autocomplete="off" autocorrect="off" ' +
               'autocapitalize="off" aria-label="Answer">';
      }
      if (filled && filled.hasOwnProperty(name)) {
        var cls = filled[name].shown ? 'shown' : 'filled';
        return '<span class="' + cls + '">' +
               escapeHtml(filled[name].text) + '</span>';
      }
      return '<span class="todo">___</span>';
    });
  }

  // Replaced by the real implementation in Task 10. Until then, figures
  // render as nothing rather than throwing.
  function renderFigure() { return ''; }

  var session = null, progress = null, filledByStep = {};

  function loadProgress() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    return parseProgress(raw);
  }

  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, serializeProgress(p)); }
    catch (e) { /* private browsing: progress simply will not persist */ }
  }

  function renderMenu() {
    progress = loadProgress();
    var list = el('topic-list');
    list.innerHTML = '';
    for (var i = 0; i < TYPES.length; i++) {
      (function (type) {
        var streak = masteryStreak(progress, type);
        var pct = Math.min(100, (streak / MASTERY_TARGET) * 100);
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.innerHTML = '<span>' + escapeHtml(LABELS[type]) + '</span>' +
                      '<span class="bar"><i style="width:' + pct + '%"></i></span>';
        b.onclick = function () { begin(createDrill(type)); };
        li.appendChild(b); list.appendChild(li);
      })(TYPES[i]);
    }
    var spots = troubleSpots(progress);
    show('trouble', spots.length > 0);
    var tl = el('trouble-list');
    tl.innerHTML = '';
    for (var s = 0; s < spots.length; s++) {
      var li2 = document.createElement('li');
      li2.textContent = LABELS[spots[s].type] + ' — missed ' +
                        spots[s].misses + (spots[s].misses === 1 ? ' time' : ' times');
      tl.appendChild(li2);
    }
    show('menu-screen', true); show('quiz-screen', false); show('done-screen', false);
  }

  function begin(s) {
    session = s; filledByStep = {};
    show('menu-screen', false); show('done-screen', false); show('quiz-screen', true);
    renderQuiz('');
  }

  function renderQuiz(feedback, tone) {
    var cur = session.current();
    if (cur === null) { renderDone(); return; }
    var p = cur.problem;

    el('progress').textContent = session.progressText();
    el('prompt').innerHTML = escapeHtml(p.prompt);

    var note = '';
    if (p.type === 'radical-calc') note = 'Calculator OK — round to the hundredths place.';
    if (p.type === 'radical-exact') note = 'No calculator. The answer must be exact — no decimals.';
    el('calc-note').textContent = note;
    show('calc-note', note !== '');

    el('figure').innerHTML = p.figure ? renderFigure(p.figure) : '';

    var ol = el('steps');
    ol.innerHTML = '';
    for (var i = 0; i < p.steps.length; i++) {
      var step = p.steps[i];
      var li = document.createElement('li');
      li.className = i < cur.stepIndex ? 'past' : (i === cur.stepIndex ? 'active' : '');
      var active = (i === cur.stepIndex) ? cur.blankName : null;
      var filled = filledByStep[i] || {};
      // Steps not yet reached stay blank so they do not give the game away.
      var body = (i <= cur.stepIndex)
        ? renderTemplate(step.template, step.blanks, active, filled)
        : '';
      li.innerHTML = '<div class="say">' + escapeHtml(step.say) + '</div>' +
                     '<div class="line">' + body + '</div>';
      ol.appendChild(li);
    }

    var fb = el('feedback');
    fb.textContent = feedback || '';
    fb.className = tone || '';

    var input = el('answer');
    if (input) {
      input.focus();
      input.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); onSubmit(input.value); }
      };
    }
  }

  function onSubmit(text) {
    var cur = session.current();
    if (!cur) return;
    var stepIndex = cur.stepIndex, name = cur.blankName;
    var result = session.submit(text);

    if (result.status === 'unreduced') {
      renderQuiz('Right value — now simplify it completely.', 'bad'); return;
    }
    if (result.status === 'malformed') {
      renderQuiz('Type an answer first.', 'bad'); return;
    }
    if (result.status === 'correct' || result.status === 'revealed') {
      filledByStep[stepIndex] = filledByStep[stepIndex] || {};
      filledByStep[stepIndex][name] = {
        text: result.status === 'revealed'
              ? String(cur.problem.steps[stepIndex].blanks[name]) : text,
        shown: result.status === 'revealed'
      };
    }
    if (result.status === 'correct') {
      if (session.current() && session.current().problem !== cur.problem) {
        filledByStep = {};
      }
      renderQuiz('', 'good'); return;
    }
    if (result.status === 'wrong') {
      renderQuiz(result.hint || 'Not quite — try that step again.', 'bad'); return;
    }
    if (result.status === 'revealed') {
      if (session.current() && session.current().problem !== cur.problem) {
        filledByStep = {};
      }
      renderQuiz(result.hint, 'bad'); return;
    }
    renderDone();
  }

  function renderDone() {
    progress = loadProgress();
    var missed = session.missed();
    var seen = {};
    for (var i = 0; i < missed.length; i++) { seen[missed[i].problem.id] = missed[i].problem; }
    // Replay each finished problem so the stored streak matches the one the
    // session used, instead of collapsing a whole session into one result.
    var finished = session.results();
    for (var r = 0; r < finished.length; r++) {
      progress = recordResult(progress, finished[r].type,
                              finished[r].problemId, finished[r].clean);
    }
    saveProgress(progress);

    el('done-title').textContent = missed.length === 0 ? 'Clean sweep' : 'Session complete';
    el('done-score').textContent = 'Score: ' + session.score();
    var rl = el('review-list');
    rl.innerHTML = '';
    for (var id in seen) {
      if (seen.hasOwnProperty(id)) {
        var li = document.createElement('li');
        li.textContent = seen[id].prompt + '  →  ' + describeAnswer(seen[id].answer);
        rl.appendChild(li);
      }
    }
    show('quiz-screen', false); show('done-screen', true);
  }

  function describeAnswer(a) {
    if (a.kind === 'fraction') return a.num + '/' + a.den;
    if (a.kind === 'radical') return (a.coef === 1 ? '' : a.coef) + '√' + a.rad;
    if (a.kind === 'pair') return '(' + a.x + ', ' + a.y + ')';
    if (a.kind === 'signs') return '(' + a.x + ', ' + a.y + ')';
    return String(a.value);
  }

  function startApp() {
    el('start-mock').onclick = function () { begin(createMockTest()); };
    el('back-to-menu').onclick = function (e) { e.preventDefault(); renderMenu(); };
    el('again').onclick = function () { renderMenu(); };
    renderMenu();
  }

  globalThis.renderTemplate = renderTemplate;
  globalThis.startApp = startApp;
})();
```

- [ ] **Step 3: Add a bootstrap and build**

Add this as the last line of `geometry-10/src/views.js`, outside and after the IIFE:

```javascript
document.addEventListener('DOMContentLoaded', function () { startApp(); });
```

Add `views.js` to the end of `geometry-10/src/manifest.txt`, then build:

```bash
python3 tools/build.py geometry-10
```

- [ ] **Step 4: Verify in a browser**

Figures render as nothing until Task 10 replaces the stub; everything else should work. Open `geometry-10/index.html` and confirm:
- The menu lists all nine topics with empty mastery bars.
- Clicking **Solve equations** shows `−9p − 1 = −145` with the first step's blank focused.
- Typing `-144` fills it green and reveals the next step.
- Typing a wrong value twice reveals the answer in red and moves on.
- On an exponent problem, `−6²` and `(−17)²` render with real superscripts.

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — all suites still green (views.js has no unit tests; it is verified in the browser).

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/views.js geometry-10/src/app.html geometry-10/src/app.css geometry-10/src/manifest.txt geometry-10/index.html
git commit -m "Add step-blank rendering and the app shell

Steps beyond the current one render empty so the chain does not give
away its own answer. The input keeps spellcheck, autocomplete,
autocorrect and autocapitalize off -- without them the browser rewrites
entries and hands over answers."
```

---

### Task 10: Rendering — coordinate plane and intercept graphs

**Files:**
- Modify: `geometry-10/src/views.js` (add `renderFigure`)
- Modify: `geometry-10/src/app.css` (figure styles)

**Interfaces:**
- Consumes: the `figure` field produced by `generate` in Task 5 — `{ shape: 'plane', target }` or `{ shape: 'line', xInt, yInt }`.
- Produces: `renderFigure(figure)` → an SVG string. Called from `renderQuiz`, already wired in Task 9.

**Why this is drawn rather than transcribed:** the picture is generated from the same numbers as the answer, so the two cannot disagree. Reading line positions off a scanned worksheet is exactly how an answer key goes wrong.

- [ ] **Step 1: Add the figure renderer**

Delete the placeholder `renderFigure` stub added in Task 9, then insert the following into `geometry-10/src/views.js`, before `function startApp()`:

```javascript
  // A -6..6 grid drawn in a 260x260 box. Both figures share it so the two
  // question types look like the same coordinate plane.
  var GRID = 6, PAD = 14, SPAN = 260;
  function gx(x) { return PAD + ((x + GRID) / (2 * GRID)) * (SPAN - 2 * PAD); }
  function gy(y) { return PAD + ((GRID - y) / (2 * GRID)) * (SPAN - 2 * PAD); }

  function gridSvg() {
    var parts = [], i;
    for (i = -GRID; i <= GRID; i++) {
      parts.push('<line x1="' + gx(i) + '" y1="' + gy(-GRID) +
                 '" x2="' + gx(i) + '" y2="' + gy(GRID) + '" class="grid"/>');
      parts.push('<line x1="' + gx(-GRID) + '" y1="' + gy(i) +
                 '" x2="' + gx(GRID) + '" y2="' + gy(i) + '" class="grid"/>');
    }
    parts.push('<line x1="' + gx(-GRID) + '" y1="' + gy(0) +
               '" x2="' + gx(GRID) + '" y2="' + gy(0) + '" class="axis"/>');
    parts.push('<line x1="' + gx(0) + '" y1="' + gy(-GRID) +
               '" x2="' + gx(0) + '" y2="' + gy(GRID) + '" class="axis"/>');
    return parts.join('');
  }

  var QUAD_CENTRE = {
    'I': [3, 3], 'II': [-3, 3], 'III': [-3, -3], 'IV': [3, -3]
  };

  function highlight(target) {
    if (target === 'origin') {
      return '<circle cx="' + gx(0) + '" cy="' + gy(0) + '" r="7" class="ring"/>';
    }
    if (target === 'x-axis') {
      return '<line x1="' + gx(-GRID) + '" y1="' + gy(0) + '" x2="' + gx(GRID) +
             '" y2="' + gy(0) + '" class="hi"/>';
    }
    if (target === 'y-axis') {
      return '<line x1="' + gx(0) + '" y1="' + gy(-GRID) + '" x2="' + gx(0) +
             '" y2="' + gy(GRID) + '" class="hi"/>';
    }
    var c = QUAD_CENTRE[target];
    if (!c) return '';
    var x0 = gx(Math.min(0, c[0] * 2)), x1 = gx(Math.max(0, c[0] * 2));
    var y0 = gy(Math.max(0, c[1] * 2)), y1 = gy(Math.min(0, c[1] * 2));
    return '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) +
           '" height="' + (y1 - y0) + '" class="quad"/>';
  }

  function lineSvg(xInt, yInt) {
    // The line through (xInt,0) and (0,yInt), extended to the grid edge.
    // slope = -yInt/xInt, and y = yInt + slope*x.
    var slope = -yInt / xInt;
    function yAt(x) { return yInt + slope * x; }
    var pts = [];
    var left = -GRID, right = GRID;
    var yl = yAt(left), yr = yAt(right);
    // Clip to the box so a steep line does not run off the figure.
    if (Math.abs(yl) > GRID) { left = (Math.sign(yl) * GRID - yInt) / slope; yl = yAt(left); }
    if (Math.abs(yr) > GRID) { right = (Math.sign(yr) * GRID - yInt) / slope; yr = yAt(right); }
    pts.push('<line x1="' + gx(left) + '" y1="' + gy(yl) + '" x2="' + gx(right) +
             '" y2="' + gy(yr) + '" class="plot"/>');
    return pts.join('');
  }

  function renderFigure(figure) {
    if (!figure) return '';
    var inner = gridSvg();
    if (figure.shape === 'plane') inner = highlight(figure.target) + inner;
    if (figure.shape === 'line') inner += lineSvg(figure.xInt, figure.yInt);
    return '<svg viewBox="0 0 ' + SPAN + ' ' + SPAN + '" width="' + SPAN +
           '" height="' + SPAN + '" role="img" aria-label="Coordinate plane">' +
           inner + '</svg>';
  }
```

Also export it alongside the others at the bottom of the IIFE:

```javascript
  globalThis.renderFigure = renderFigure;
```

- [ ] **Step 2: Add the figure styles**

Append to `geometry-10/src/app.css`:

```css
#figure { margin-bottom: 1rem; }
#figure svg { max-width: 100%; height: auto; }
.grid { stroke: currentColor; stroke-width: .5; opacity: .18; }
.axis { stroke: currentColor; stroke-width: 1.5; opacity: .8; }
.plot { stroke: var(--ok); stroke-width: 2.5; }
.hi { stroke: var(--no); stroke-width: 4; opacity: .8; }
.ring { fill: none; stroke: var(--no); stroke-width: 3; }
.quad { fill: var(--no); opacity: .15; }
```

- [ ] **Step 3: Build and verify in a browser**

```bash
python3 tools/build.py geometry-10
```

Open `geometry-10/index.html` and check each graphical topic:
- **Label the coordinate plane** — the highlighted axis, origin ring, or shaded quadrant is unmistakable, and only one thing is highlighted at a time.
- **Signs in each quadrant** — the named quadrant is shaded; typing `-,+` for quadrant II is accepted.
- **x- and y-intercepts** — the line visibly crosses both axes at whole-number points, and those points match the answers. Reload several times to see different lines, including steep ones, and confirm none run outside the box.

- [ ] **Step 4: Run the tests**

Run: `cd geometry-10 && ./tests/run.sh`
Expected: PASS — all suites green.

- [ ] **Step 5: Commit**

```bash
git add geometry-10/src/views.js geometry-10/src/app.css geometry-10/index.html
git commit -m "Draw the coordinate plane and intercept graphs as SVG

Figures are generated from the same numbers as the answer, so the
picture and the answer key cannot disagree. Steep lines are clipped to
the grid box rather than allowed to run outside the figure."
```

---

### Task 11: README and final verification

**Files:**
- Create: `README.md`
- Modify: `index.html`, `geometry-10/index.html` (final rebuild)

**Interfaces:**
- Consumes: everything.
- Produces: a repository someone else can pick up, and a verified-clean publish state.

- [ ] **Step 1: Write the README**

`README.md`. **Check every sentence for names before committing — this file is the first thing a visitor reads.**

```markdown
# Study Time

Browser-based study tools, one per test or topic, organized by grade.

## Using them

Open `index.html` in any browser — double-click it, or `open index.html`.
Nothing to install, no internet needed. It works offline forever.

Pick a topic from the landing page. Progress is saved in the browser, so it
survives closing the tab; a different browser or profile means separate
progress.

## What's here

| Topic | Grade | Covers |
| --- | --- | --- |
| `geometry-10/` | 10th | Test #1 algebra review: coordinate plane, intercepts, multi-step equations, evaluating expressions, fractions, radicals, exponents |

## Geometry — Test #1: Algebra Review

Two modes:

- **Drill one topic** — work problems of a single type until the mastery bar
  fills, which takes four in a row answered correctly on the first try. The
  study guide's own problems come first, then generated variants, so drilling
  can't decay into memorizing the guide.
- **Practice test** — twenty mixed questions proportioned like the study
  guides, scored, ending with what to review.

Multi-step problems are worked one step at a time, with a blank for each
number. A wrong entry gets one targeted hint and a retry; a second wrong entry
reveals that step and moves on.

Two rules worth knowing:

- **An unreduced fraction doesn't cost a try.** Enter `108/90` where `6/5` is
  wanted and it says *"Right value — now simplify it completely"* and lets you
  keep going. The value is right; only the simplification is missing.
- **Calculator and no-calculator radicals are enforced separately.** `√250` as
  a "with calculator" question wants `15.81`, rounded to exactly hundredths.
  The same `√250` as a "no calculator" question wants `5√10` and rejects any
  decimal, because the study guide is explicit about it.

## How it's built

Source lives in each topic's `src/`. **`index.html` files are generated — edit
the sources, not them.**

    python3 tools/build.py .              # rebuild the landing page
    python3 tools/build.py geometry-10    # rebuild the geometry tool
    cd geometry-10 && ./tests/run.sh      # run the unit tests

| File | Responsibility |
| --- | --- |
| `src/checker.js` | Compares an answer per kind; infers a grading rule per blank |
| `src/problems.js` | The 35 study guide problems with their step chains |
| `src/generators.js` | Seeded generators producing fresh problems of each type |
| `src/hints.js` | Detects specific misconceptions and names them |
| `src/session.js` | Drill and test sequencing, attempts, scoring |
| `src/storage.js` | localStorage mastery and trouble spots |
| `src/views.js` | All DOM: step blanks, coordinate plane and graph SVG |

Everything except `views.js` is DOM-free, which is what makes it testable
without a browser.

### Tests

There is no Node on the target machine, so tests run under `jsc`
(JavaScriptCore), which ships with macOS at
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`.
`./tests/run.sh` runs every `tests/*.test.js`.

The suite's most important test isn't about the UI: it walks every problem's
step chain, confirms the chain ends at the declared answer, and independently
substitutes that answer back into the printed problem. A mistyped problem
fails the build instead of reaching a student.

## Notes for whoever changes this next

- **This repository is public and deliberately carries no student names.**
  Topics are organized by grade. Keep it that way — in paths, page copy,
  commit messages, and this file.
- **`**/reference/` is gitignored** and holds scanned worksheets and answer
  keys. They're the teacher's materials and they carry handwritten names.
  Don't commit them, and don't remove the ignore rule.
- **The answer keys are the authority.** Every problem in `problems.js` is
  verified against them. If an answer looks wrong, re-read the key before
  changing the data — one problem was already reconstructed incorrectly from a
  student's own corrected work, reaching the right answer through the wrong
  equation.
- **`−6²` and `(−17)²` must keep real superscripts and parentheses.** That
  distinction is the entire question; rendering it as `-6^2` destroys the item.
- **Don't let the answer input lose `spellcheck="false"`,
  `autocomplete="off"`, `autocorrect="off"`, or `autocapitalize="off"`.**
  Without them the browser rewrites entries and hands over answers.
- **Steps below the current one render empty on purpose.** Showing the whole
  chain up front tells the student where they're going before they think.
```

- [ ] **Step 2: Rebuild everything from source**

```bash
python3 tools/build.py .
python3 tools/build.py geometry-10
```

- [ ] **Step 3: Run the full suite**

```bash
cd geometry-10 && ./tests/run.sh; cd ..
```

Expected: every suite reports `0 failed`.

- [ ] **Step 4: Verify the publish state**

```bash
git check-ignore -v geometry-10/reference/*.pdf
git status --porcelain --untracked-files=all
git ls-files | xargs grep -ril "$(git config user.name | awk '{print $NF}')" || echo "no surname in tracked files"
```

Expected: every PDF reported as ignored; no `reference/` path in the status
output; and the grep finding nothing. **If any check fails, stop and fix it
before committing** — this is the last gate before the repository is public.

Then open `index.html`, click through to the geometry tool, complete one drill
and one practice test end to end, and confirm progress persists across a reload.

- [ ] **Step 5: Commit**

```bash
git add README.md index.html geometry-10/index.html
git commit -m "Add README and rebuild

Documents both modes, the build and test commands, and the constraints
that are easy to break by accident: the no-names rule, the ignored
reference materials, the superscript rendering, and the input attributes
that stop the browser handing over answers."
```
