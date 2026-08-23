# Vocabulary Study Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable two-mode vocabulary quiz engine in `shared/vocab/`, and ship 10th grade Spanish (Lección preliminar) as its first subject.

**Architecture:** The engine is subject-agnostic: it knows only "side A" and "side B" of a word pair, with every human-readable label supplied by the subject's config. A subject is one data file plus three tiny plumbing files. All logic modules are DOM-free and unit tested under JavaScriptCore; a single `views.js` owns every DOM touch. `tools/build.py` inlines shared and subject sources into one self-contained `index.html`.

**Tech Stack:** Plain ES5-style browser JavaScript in IIFE modules exporting onto `globalThis`. No dependencies, no bundler, no internet at runtime. Build script is Python 3. Tests run under `jsc` (JavaScriptCore, ships with macOS).

**Spec:** `docs/superpowers/specs/2026-08-23-vocabulary-framework-design.md`

## Global Constraints

- **No subject-specific word appears in `shared/vocab/`.** Not "Spanish", not "English", not "verb". Sides are `a`/`b`; all labels come from `SUBJECT.sideA.name` / `SUBJECT.sideB.name`. A reviewer greps the shared directory for "Spanish" and finds nothing.
- **This repository is public and carries no student names** — not in paths, page copy, commit messages, or docs.
- **`**/reference/` is gitignored and must never be committed.** The rule already exists in `.gitignore`; do not weaken it.
- **`index.html` files are generated.** Edit `src/`, then run the build. Never hand-edit an `index.html`.
- **Word list content is transcribed verbatim from the answer key**, including inconsistent trailing periods (`Hasta luego` has none, `Adiós.` does) and the English parentheticals `(familiar)`, `(formal)`, `(form.)`, `(familiar/formal)`. Those parentheticals are the only thing distinguishing six otherwise identical items. Do not normalize, do not tidy.
- **ES5-compatible JavaScript only** — `var`, `function`, no arrow functions, no `let`/`const`, no template literals, no `class`. Match the existing style in `geometry-10/src/`.
- **Modules are IIFEs that export by assigning to `globalThis`.** No `import`/`export`, no module system.
- **Every module except `views.js` must be DOM-free**, so it can be tested under `jsc`.
- **Tests run under** `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`. There is no Node on the target machine. `check(label, actual, expected)` compares with `===`, so assert scalars — lengths, joined strings, booleans — never objects or arrays directly.
- **Randomness is always injectable.** Every function that shuffles or draws takes an `rng` function. `Math.random` may appear only as the default seed at the top of a public entry point, never inside logic under test.
- **`geometry-10/` is not modified by this plan.** Its build output must stay byte-identical.

---

## File Structure

**Created:**

| File | Responsibility |
| --- | --- |
| `shared/vocab/quiz.js` | Seeded RNG, shuffling, question construction, round state, two-try and retry rules |
| `shared/vocab/storage.js` | Pure localStorage record parsing and updating; key derived from subject id |
| `shared/vocab/validate.js` | Word-list validation, invoked by each subject's test suite |
| `shared/vocab/views.js` | Every DOM touch: menu, quiz, and end screens |
| `shared/vocab/vocab.css` | The entire look |
| `shared/vocab/tests/helpers.js` | `check` / `done` assertion helpers (canonical copy for the framework) |
| `shared/vocab/tests/fixture.js` | A small invented subject used by engine tests |
| `shared/vocab/tests/run.sh` | Runs the engine suites |
| `shared/vocab/tests/validate.test.js` | Validator behaviour |
| `shared/vocab/tests/quiz.test.js` | Question construction, main rounds, retry rounds |
| `shared/vocab/tests/storage.test.js` | Progress record behaviour |
| `shared/vocab/README.md` | How to add a subject; the standing invariants |
| `spanish-10/src/words.js` | The 29 pairs, subject metadata, confusable clusters |
| `spanish-10/src/app.html` | Page shell with `{{CSS}}` / `{{JS}}` tokens and one mount point |
| `spanish-10/src/manifest.txt` | Shared JS by relative path, then `words.js` |
| `spanish-10/src/styles.txt` | Shared CSS by relative path |
| `spanish-10/tests/run.sh` | Runs the subject suite |
| `spanish-10/tests/words.test.js` | Validates this subject's word list |
| `spanish-10/index.html` | Generated |

**Modified:**

| File | Change |
| --- | --- |
| `tools/build.py` | Optional `styles.txt` CSS manifest, defaulting to `["app.css"]` |
| `src/app.html` | A Spanish entry under 10th Grade on the landing page |
| `index.html` | Regenerated landing page |
| `README.md` | Table row, Spanish section, pointer to the shared README |

## Model Routing

Dispatch each task to a subagent at the tier its difficulty warrants:

| Task | Model | Why |
| --- | --- | --- |
| 1 build.py | Sonnet | Small, well-specified change with the test written out |
| 2 validator | Sonnet | Straightforward checks, fully specified |
| 3 question construction | Opus | Seeded draw with subtle correctness conditions |
| 4 main round | Opus | The two-try state machine; real failure modes |
| 5 retry round | Opus | Requeue and termination; an off-by-one is an infinite loop |
| 6 storage | Haiku | Plain object in, plain object out, tests fully written |
| 7 word list | Sonnet | Verbatim transcription of data supplied in this plan |
| 8 views: shell, menu, quiz | Opus | The largest DOM surface, wires the whole engine |
| 9 views: end screen and retry | Opus | Three-tier review list and the retry handoff |
| 10 landing page and docs | Sonnet | Prose and a table row, content supplied here |

---

### Task 1: Build script learns a CSS manifest

`tools/build.py` reads `src/app.css` by fixed name, so a shared stylesheet would have to be copied into every subject. Give CSS the same manifest treatment JS already has. JS needs no change: manifest entries are joined onto `<project>/src/`, so `../../shared/vocab/quiz.js` already resolves correctly.

**Files:**
- Modify: `tools/build.py`
- Test: `tools/tests/build.test.sh` (create)

**Interfaces:**
- Consumes: nothing
- Produces: a project may contain `src/styles.txt`, one CSS filename per line, `#` comments and blank lines ignored, paths relative to `src/`. When the file is absent the build uses `["app.css"]`, exactly as today.

- [ ] **Step 1: Write the failing test**

Create `tools/tests/build.test.sh`:

```sh
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
```

Then `chmod +x tools/tests/build.test.sh`.

- [ ] **Step 2: Run test to verify it fails**

Run: `./tools/tests/build.test.sh`
Expected: FAIL — the scratch project's `styles.txt` is ignored, so `color: blue` is not in the output and the script prints `FAIL: shared.css missing`.

- [ ] **Step 3: Write minimal implementation**

In `tools/build.py`, generalize `read_manifest` to take a filename and a default, then use it for CSS. Replace the existing `read_manifest` and the CSS half of `build`:

```python
def read_manifest(src, name="manifest.txt", default=None):
    path = os.path.join(src, name)
    if not os.path.exists(path):
        return list(default or [])
    names = []
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"):
                names.append(line)
    return names
```

and inside `build`:

```python
    js = "\n".join(read(src, name) for name in read_manifest(src))
    css = "\n".join(read(src, name)
                    for name in read_manifest(src, "styles.txt", ["app.css"]))
    html = read(src, "app.html")
    for token, value in (("{{CSS}}", css), ("{{JS}}", js)):
```

Update the module docstring's second line to:

```python
  <project-dir> holds src/app.html, src/manifest.txt, and either src/app.css
  or a src/styles.txt naming one or more stylesheets
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `./tools/tests/build.test.sh`
Expected: `build.test.sh: passed`

Then confirm the existing projects are untouched:

Run: `git stash list > /dev/null; python3 tools/build.py geometry-10 && python3 tools/build.py . && git diff --stat -- geometry-10/index.html index.html`
Expected: the two "wrote ..." lines, and **no diff output at all** — both regenerated files are byte-identical to what is committed.

- [ ] **Step 5: Commit**

```bash
git add tools/build.py tools/tests/build.test.sh
git commit -m "Let a project list its stylesheets in styles.txt"
```

---

### Task 2: Word list validator

A subject's word list is hand-transcribed from an answer key. A duplicate string on either side silently creates a question with two correct options; too few pairs makes four distinct options impossible. This validator turns both into a failing test rather than a confusing evening.

**Files:**
- Create: `shared/vocab/validate.js`
- Create: `shared/vocab/tests/helpers.js`
- Create: `shared/vocab/tests/fixture.js`
- Create: `shared/vocab/tests/run.sh`
- Test: `shared/vocab/tests/validate.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `globalThis.validateSubject(subject)` → array of error strings, empty when valid
  - `globalThis.FIXTURE` (from `tests/fixture.js`) → a valid six-pair subject used by every engine test
  - `globalThis.check(label, actual, expected)` and `globalThis.done(suite)` (from `tests/helpers.js`)

- [ ] **Step 1: Write the shared test scaffolding**

Create `shared/vocab/tests/helpers.js` — identical to `geometry-10/tests/helpers.js`:

```js
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

Create `shared/vocab/tests/fixture.js` — an invented subject, deliberately not Spanish, proving the engine is subject-agnostic:

```js
// A small invented subject. The engine must never care what the sides mean,
// so the fixture is not a real language.
globalThis.FIXTURE = {
  id: 'fixture-1',
  title: 'Fixture Subject',
  subtitle: 'Test data only',
  sideA: { name: 'Alpha', lang: 'en' },
  sideB: { name: 'Beta', lang: 'en' },
  pairs: [
    { a: 'a1', b: 'b1' },
    { a: 'a2', b: 'b2' },
    { a: 'a3', b: 'b3' },
    { a: 'a4', b: 'b4' },
    { a: 'a5', b: 'b5' },
    { a: 'a6', b: 'b6' }
  ],
  confusables: [
    { members: ['a1', 'a2'], note: 'a1 and a2 are easy to mix up.' }
  ]
};
```

Create `shared/vocab/tests/run.sh` (then `chmod +x`):

```sh
#!/bin/sh
# Runs every *.test.js for the shared vocabulary engine with JavaScriptCore.
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

Create `shared/vocab/tests/validate.test.js`:

```js
load('tests/helpers.js');
load('tests/fixture.js');
load('validate.js');

function clone(subject) { return JSON.parse(JSON.stringify(subject)); }
function errs(subject) { return validateSubject(subject).join(' | '); }

// --- a well-formed subject reports nothing
check('fixture is valid', validateSubject(FIXTURE).length, 0);

// --- duplicate strings on either side make a question unanswerable
var dupA = clone(FIXTURE);
dupA.pairs[3].a = 'a1';
check('duplicate side A caught', validateSubject(dupA).length, 1);
check('duplicate side A names the string', errs(dupA).indexOf('a1') >= 0, true);

var dupB = clone(FIXTURE);
dupB.pairs[3].b = 'b1';
check('duplicate side B caught', validateSubject(dupB).length, 1);
check('duplicate side B names the string', errs(dupB).indexOf('b1') >= 0, true);

// --- empty or untrimmed entries
var blank = clone(FIXTURE);
blank.pairs[2].b = '';
check('empty side caught', validateSubject(blank).length, 1);

var spacey = clone(FIXTURE);
spacey.pairs[2].b = ' b3 ';
check('untrimmed side caught', validateSubject(spacey).length, 1);

// --- four options are impossible with fewer than four pairs
var tiny = clone(FIXTURE);
tiny.pairs = tiny.pairs.slice(0, 3);
check('too few pairs caught', validateSubject(tiny).length, 1);

// --- a confusable pointing at nothing is a typo in the word list
var ghost = clone(FIXTURE);
ghost.confusables[0].members.push('a99');
check('unknown confusable member caught', validateSubject(ghost).length, 1);
check('unknown member is named', errs(ghost).indexOf('a99') >= 0, true);

// --- a cluster of one distinguishes nothing
var lonely = clone(FIXTURE);
lonely.confusables[0].members = ['a1'];
check('single-member cluster caught', validateSubject(lonely).length, 1);

// --- missing metadata
var nameless = clone(FIXTURE);
delete nameless.sideA;
check('missing sideA caught', validateSubject(nameless).length, 1);

var idless = clone(FIXTURE);
idless.id = '';
check('missing id caught', validateSubject(idless).length, 1);

// --- a subject with no confusables at all is fine
var plain = clone(FIXTURE);
delete plain.confusables;
check('confusables are optional', validateSubject(plain).length, 0);

done('validate');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `./shared/vocab/tests/run.sh`
Expected: FAIL — `validate.js` does not exist, so `load('validate.js')` throws.

- [ ] **Step 4: Write minimal implementation**

Create `shared/vocab/validate.js`:

```js
// Checks a subject's word list for the mistakes that hand-transcription makes.
// A duplicate string on one side silently creates a question with two correct
// options, which is worse than a crash: the student is marked wrong for being
// right. This runs in each subject's own test suite, so a typo fails the build.
(function () {
  var MIN_PAIRS = 4;   // four distinct options are impossible below this

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.length > 0;
  }

  function validateSubject(subject) {
    var errors = [];
    if (!subject || typeof subject !== 'object') {
      return ['subject is not an object'];
    }
    if (!isNonEmptyString(subject.id)) errors.push('subject.id is missing');
    if (!isNonEmptyString(subject.title)) errors.push('subject.title is missing');
    for (var s = 0; s < 2; s++) {
      var key = s === 0 ? 'sideA' : 'sideB';
      var side = subject[key];
      if (!side || !isNonEmptyString(side.name)) {
        errors.push('subject.' + key + '.name is missing');
      }
    }

    var pairs = subject.pairs;
    if (!(pairs instanceof Array) || pairs.length < MIN_PAIRS) {
      errors.push('subject.pairs needs at least ' + MIN_PAIRS + ' entries');
      return errors;
    }

    var seen = { a: {}, b: {} };
    var sides = ['a', 'b'];
    for (var i = 0; i < pairs.length; i++) {
      for (var k = 0; k < sides.length; k++) {
        var name = sides[k];
        var text = pairs[i][name];
        if (!isNonEmptyString(text)) {
          errors.push('pair ' + i + ' side ' + name + ' is empty');
          continue;
        }
        if (text !== text.trim()) {
          errors.push('pair ' + i + ' side ' + name + ' has stray whitespace: "' + text + '"');
          continue;
        }
        if (seen[name].hasOwnProperty(text)) {
          errors.push('duplicate side ' + name + ' entry: "' + text + '"');
        }
        seen[name][text] = true;
      }
    }

    var clusters = subject.confusables || [];
    for (var c = 0; c < clusters.length; c++) {
      var members = clusters[c].members || [];
      if (members.length < 2) {
        errors.push('confusable cluster ' + c + ' needs at least two members');
      }
      if (!isNonEmptyString(clusters[c].note)) {
        errors.push('confusable cluster ' + c + ' has no note');
      }
      for (var m = 0; m < members.length; m++) {
        if (!seen.a.hasOwnProperty(members[m])) {
          errors.push('confusable member is not a side A entry: "' + members[m] + '"');
        }
      }
    }
    return errors;
  }

  globalThis.MIN_PAIRS = MIN_PAIRS;
  globalThis.validateSubject = validateSubject;
})();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./shared/vocab/tests/run.sh`
Expected: `validate: 14 passed, 0 failed`

- [ ] **Step 6: Commit**

```bash
git add shared/vocab/validate.js shared/vocab/tests
git commit -m "Validate a subject's word list before it reaches a student"
```

---

### Task 3: Seeded randomness and question construction

The core of a question: one prompt, four options, exactly one correct. Distractors are drawn from the whole pool on purpose — near-synonyms landing together is the discrimination the quiz tests — so the correctness conditions have to be enforced here rather than by hoping.

**Files:**
- Create: `shared/vocab/quiz.js`
- Test: `shared/vocab/tests/quiz.test.js`

**Interfaces:**
- Consumes: `validateSubject` is not used here; `FIXTURE` from `tests/fixture.js` in tests only
- Produces:
  - `globalThis.OPTION_COUNT` → `4`
  - `globalThis.makeRng(seed)` → `function()` returning a float in `[0, 1)`
  - `globalThis.shuffle(list, rng)` → a new shuffled array, input untouched
  - `globalThis.MODE_A_TO_B` → `'a-to-b'`, `globalThis.MODE_B_TO_A` → `'b-to-a'`
  - `globalThis.sideKeys(mode)` → `{ prompt: 'a', answer: 'b' }` or the reverse
  - `globalThis.buildQuestion(subject, mode, pairIndex, rng)` → `{ pairIndex, prompt, answer, options }` where `options` has `OPTION_COUNT` entries including `answer`
  - `globalThis.noteFor(subject, pairIndex)` → the confusable note whose cluster contains that pair's side A string, or `''`

- [ ] **Step 1: Write the failing test**

Create `shared/vocab/tests/quiz.test.js`. Tests assert properties rather than exact shuffled output, so the suite does not encode the RNG's internals — but determinism itself is asserted, which is what later tasks depend on.

```js
load('tests/helpers.js');
load('tests/fixture.js');
load('quiz.js');

function sorted(list) { return list.slice().sort().join(','); }

// --- the RNG is seeded, in range, and reproducible
var r1 = makeRng(7), r2 = makeRng(7);
check('rng is reproducible', r1() === r2(), true);
var inRange = true;
var probe = makeRng(99);
for (var i = 0; i < 500; i++) {
  var v = probe();
  if (!(v >= 0 && v < 1)) inRange = false;
}
check('rng stays in [0,1)', inRange, true);

// --- shuffle keeps every element and does not mutate its input
var source = ['x', 'y', 'z', 'w', 'v'];
var mixed = shuffle(source, makeRng(3));
check('shuffle preserves length', mixed.length, 5);
check('shuffle preserves elements', sorted(mixed), sorted(source));
check('shuffle does not mutate input', source.join(','), 'x,y,z,w,v');
check('shuffle is seeded', shuffle(source, makeRng(3)).join(','), mixed.join(','));

// --- sides
check('a-to-b prompts from a', sideKeys(MODE_A_TO_B).prompt, 'a');
check('a-to-b answers from b', sideKeys(MODE_A_TO_B).answer, 'b');
check('b-to-a prompts from b', sideKeys(MODE_B_TO_A).prompt, 'b');
check('b-to-a answers from a', sideKeys(MODE_B_TO_A).answer, 'a');

// --- a question is well formed in both directions, for every pair and seed
var wrongCount = 0, missingAnswer = 0, dupOptions = 0, wrongSide = 0, wrongPrompt = 0;
var modes = [MODE_A_TO_B, MODE_B_TO_A];
for (var m = 0; m < modes.length; m++) {
  var keys = sideKeys(modes[m]);
  for (var p = 0; p < FIXTURE.pairs.length; p++) {
    for (var seed = 1; seed <= 40; seed++) {
      var q = buildQuestion(FIXTURE, modes[m], p, makeRng(seed));
      if (q.options.length !== OPTION_COUNT) wrongCount += 1;
      if (q.options.indexOf(q.answer) === -1) missingAnswer += 1;
      if (sorted(q.options).split(',').length !== OPTION_COUNT) dupOptions += 1;
      var seen = {};
      for (var o = 0; o < q.options.length; o++) {
        if (seen[q.options[o]]) dupOptions += 1;
        seen[q.options[o]] = true;
        var fromPool = false;
        for (var f = 0; f < FIXTURE.pairs.length; f++) {
          if (FIXTURE.pairs[f][keys.answer] === q.options[o]) fromPool = true;
        }
        if (!fromPool) wrongSide += 1;
      }
      if (q.prompt !== FIXTURE.pairs[p][keys.prompt]) wrongPrompt += 1;
      if (q.answer !== FIXTURE.pairs[p][keys.answer]) wrongPrompt += 1;
    }
  }
}
check('always four options', wrongCount, 0);
check('answer always present', missingAnswer, 0);
check('options never duplicate', dupOptions, 0);
check('options come from the answer side only', wrongSide, 0);
check('prompt and answer match the pair', wrongPrompt, 0);

// --- the answer is not stuck in one slot
var slots = {};
for (var s = 1; s <= 60; s++) {
  var qq = buildQuestion(FIXTURE, MODE_A_TO_B, 0, makeRng(s));
  slots[qq.options.indexOf(qq.answer)] = true;
}
var distinctSlots = 0;
for (var k in slots) { if (slots.hasOwnProperty(k)) distinctSlots += 1; }
check('answer lands in more than one slot', distinctSlots > 1, true);

// --- confusable notes are looked up by side A string, whichever mode is running
check('note found for a clustered pair', noteFor(FIXTURE, 0), 'a1 and a2 are easy to mix up.');
check('note found for the sibling', noteFor(FIXTURE, 1), 'a1 and a2 are easy to mix up.');
check('no note for an unclustered pair', noteFor(FIXTURE, 4), '');

done('quiz');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./shared/vocab/tests/run.sh`
Expected: FAIL — `quiz.js` does not exist, so `load('quiz.js')` throws.

- [ ] **Step 3: Write minimal implementation**

Create `shared/vocab/quiz.js`. Nothing in this file names a language or a subject; sides are `a` and `b` and the subject supplies every label.

```js
// The quiz engine. Subject-agnostic: it knows only side A and side B of a
// pair, and every label the student reads comes from the subject's config.
// No DOM. Every draw takes an injected rng so rounds are reproducible in tests.
(function () {
  var OPTION_COUNT = 4;
  var MODE_A_TO_B = 'a-to-b';
  var MODE_B_TO_A = 'b-to-a';

  // A small linear congruential generator. Deterministic per seed, which is
  // the whole point: a failing round can be replayed exactly.
  function makeRng(seed) {
    var state = (seed >>> 0) || 1;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffle(list, rng) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function sideKeys(mode) {
    return mode === MODE_B_TO_A
      ? { prompt: 'b', answer: 'a' }
      : { prompt: 'a', answer: 'b' };
  }

  // Distractors are drawn from the entire pool, deliberately including near
  // synonyms: telling those apart is what the quiz is actually testing.
  function buildQuestion(subject, mode, pairIndex, rng) {
    var keys = sideKeys(mode);
    var pairs = subject.pairs;
    var answer = pairs[pairIndex][keys.answer];
    var pool = [];
    for (var i = 0; i < pairs.length; i++) {
      if (i !== pairIndex) pool.push(pairs[i][keys.answer]);
    }
    var options = shuffle(pool, rng).slice(0, OPTION_COUNT - 1);
    options.push(answer);
    return {
      pairIndex: pairIndex,
      prompt: pairs[pairIndex][keys.prompt],
      answer: answer,
      options: shuffle(options, rng)
    };
  }

  // Clusters are declared with side A strings, so the lookup is by pair, not
  // by whatever text happens to be on screen in the current mode.
  function noteFor(subject, pairIndex) {
    var clusters = subject.confusables || [];
    var key = subject.pairs[pairIndex].a;
    for (var c = 0; c < clusters.length; c++) {
      var members = clusters[c].members || [];
      for (var m = 0; m < members.length; m++) {
        if (members[m] === key) return clusters[c].note;
      }
    }
    return '';
  }

  globalThis.OPTION_COUNT = OPTION_COUNT;
  globalThis.MODE_A_TO_B = MODE_A_TO_B;
  globalThis.MODE_B_TO_A = MODE_B_TO_A;
  globalThis.makeRng = makeRng;
  globalThis.shuffle = shuffle;
  globalThis.sideKeys = sideKeys;
  globalThis.buildQuestion = buildQuestion;
  globalThis.noteFor = noteFor;
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./shared/vocab/tests/run.sh`
Expected: `quiz: 19 passed, 0 failed`, and `validate` still passing.

- [ ] **Step 5: Commit**

```bash
git add shared/vocab/quiz.js shared/vocab/tests/quiz.test.js
git commit -m "Build four-option questions from a seeded draw"
```

---

### Task 4: Main rounds and the two-try rule

A main round walks every pair once, shuffled. A first miss reddens the chosen option and leaves the question up for a second attempt; a second miss reveals the answer with the subject's distinction note and moves on. Every pair ends the round as clean, second-try, or missed.

**Files:**
- Modify: `shared/vocab/quiz.js`
- Test: `shared/vocab/tests/quiz.test.js` (append)

**Interfaces:**
- Consumes: `buildQuestion`, `shuffle`, `makeRng`, `noteFor`, `sideKeys`, `OPTION_COUNT` from Task 3
- Produces: `globalThis.createRound(subject, mode, options)` where `options` is `{ rng, items, retry }`, all optional. The returned object has:
  - `current()` → the question object, or `null` when the round is over
  - `answer(choice)` → `{ status, correct, chosen, answer, note, pairIndex, complete }` where `status` is one of `'correct'`, `'correct-second'`, `'retry'`, `'revealed'`, `'done'`. `answer` is the correct string, populated only on `'revealed'` (otherwise `''`); `note` likewise.
  - `isDone()` → boolean
  - `progressText()` → e.g. `'Question 3 of 6'`
  - `summary()` → `{ total, clean, second, missed, unclean }` where `second`, `missed` and `unclean` are arrays of pair indices and `unclean` is `second` followed by `missed`
  - `mode()` → the mode string

- [ ] **Step 1: Write the failing test**

Append to `shared/vocab/tests/quiz.test.js`, above the final `done('quiz');` line:

```js
// ---------- main rounds ----------

function wrongOption(q) {
  for (var i = 0; i < q.options.length; i++) {
    if (q.options[i] !== q.answer) return q.options[i];
  }
  return null;
}

function mainRound(seed) {
  return createRound(FIXTURE, MODE_A_TO_B, { rng: makeRng(seed || 5) });
}

// --- a round covers every pair exactly once
var round = mainRound();
var seenPairs = {}, steps = 0, repeats = 0;
while (!round.isDone() && steps < 100) {
  var q = round.current();
  if (seenPairs[q.pairIndex]) repeats += 1;
  seenPairs[q.pairIndex] = true;
  round.answer(q.answer);
  steps += 1;
}
check('round asks every pair once', steps, FIXTURE.pairs.length);
check('round never repeats a pair', repeats, 0);
check('round finishes', round.isDone(), true);
check('current is null when done', round.current(), null);

// --- a clean round scores full marks and lists nothing to review
var clean = round.summary();
check('clean count is the whole list', clean.clean, FIXTURE.pairs.length);
check('nothing needed a second try', clean.second.length, 0);
check('nothing was missed', clean.missed.length, 0);
check('nothing to review', clean.unclean.length, 0);
check('total is the round size', clean.total, FIXTURE.pairs.length);

// --- a first miss keeps the same question up for a second try
var r = mainRound(11);
var q1 = r.current();
var miss1 = r.answer(wrongOption(q1));
check('first miss says retry', miss1.status, 'retry');
check('first miss is not correct', miss1.correct, false);
check('first miss reports what was chosen', miss1.chosen, wrongOption(q1));
check('first miss reveals nothing', miss1.answer, '');
check('question stays up', r.current().pairIndex, q1.pairIndex);
check('options are unchanged', r.current().options.join('|'), q1.options.join('|'));

// --- getting it on the second try counts as second-try, not clean
var second = r.answer(q1.answer);
check('second try accepted', second.status, 'correct-second');
check('second try is correct', second.correct, true);
check('round advanced', r.current().pairIndex === q1.pairIndex, false);

// --- two misses reveal the answer and move on
var q2 = r.current();
r.answer(wrongOption(q2));
var revealed = r.answer(wrongOption(q2));
check('second miss reveals', revealed.status, 'revealed');
check('reveal shows the answer', revealed.answer, q2.answer);
check('reveal reports the pair', revealed.pairIndex, q2.pairIndex);
check('reveal advanced', r.current().pairIndex === q2.pairIndex, false);

// --- finish that round and check the three-tier summary
while (!r.isDone()) { r.answer(r.current().answer); }
var s = r.summary();
check('one pair took a second try', s.second.length, 1);
check('the second-try pair is the first one', s.second[0], q1.pairIndex);
check('one pair was missed outright', s.missed.length, 1);
check('the missed pair is the second one', s.missed[0], q2.pairIndex);
check('clean is the rest', s.clean, FIXTURE.pairs.length - 2);
check('review list is second-try then missed', s.unclean.join(','),
      String(q1.pairIndex) + ',' + String(q2.pairIndex));

// --- a revealed answer carries the subject's distinction note when there is one
var noted = createRound(FIXTURE, MODE_A_TO_B, { rng: makeRng(2), items: [0] });
var nq = noted.current();
noted.answer(wrongOption(nq));
var nres = noted.answer(wrongOption(nq));
check('note travels with the reveal', nres.note, 'a1 and a2 are easy to mix up.');
check('single-item round is now done', noted.isDone(), true);
check('last answer reports completion', nres.complete, true);

var quiet = createRound(FIXTURE, MODE_A_TO_B, { rng: makeRng(2), items: [4] });
var qq2 = quiet.current();
quiet.answer(wrongOption(qq2));
check('unclustered pair reveals without a note', quiet.answer(wrongOption(qq2)).note, '');

// --- progress text counts questions, not attempts
var pr = mainRound(21);
check('progress starts at one', pr.progressText(), 'Question 1 of 6');
pr.answer(wrongOption(pr.current()));
check('a retry does not advance progress', pr.progressText(), 'Question 1 of 6');
pr.answer(pr.current().answer);
check('a finished question advances progress', pr.progressText(), 'Question 2 of 6');

// --- answering a finished round is inert rather than an error
var over = createRound(FIXTURE, MODE_A_TO_B, { rng: makeRng(2), items: [3] });
over.answer(over.current().answer);
check('answering past the end is inert', over.answer('anything').status, 'done');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./shared/vocab/tests/run.sh`
Expected: FAIL — `createRound is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `shared/vocab/quiz.js`, add `createRound` after `noteFor` and export it. Keep the closure style `geometry-10/src/session.js` uses.

```js
  // A round of questions. Two rules live here and nowhere else:
  //   main  - two tries, then the answer is revealed and the round moves on
  //   retry - one try; a miss goes to the back of the queue and comes around
  //           again, so the round ends only when every word has been answered
  //           correctly once
  function createRound(subject, mode, options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9) + 1);
    var isRetry = !!opts.retry;
    var triesAllowed = isRetry ? 1 : 2;

    var items = opts.items ? opts.items.slice() : null;
    if (!items) {
      items = [];
      for (var i = 0; i < subject.pairs.length; i++) items.push(i);
    }
    var queue = shuffle(items, rng);
    var total = queue.length;

    var current = null, tries = 0, done = false;
    var answered = 0, cleared = 0, clean = 0;
    var second = [], missed = [];

    function loadNext() {
      if (!queue.length) { done = true; current = null; return; }
      current = buildQuestion(subject, mode, queue.shift(), rng);
      tries = 0;
    }

    function result(status, chosen, shown, note) {
      return {
        status: status,
        correct: status === 'correct' || status === 'correct-second',
        chosen: chosen,
        answer: shown,
        note: note,
        pairIndex: current ? current.pairIndex : -1,
        complete: false
      };
    }

    function answer(choice) {
      if (done || current === null) {
        return { status: 'done', correct: false, chosen: choice, answer: '',
                 note: '', pairIndex: -1, complete: true };
      }
      var pairIndex = current.pairIndex;

      if (choice === current.answer) {
        var status = tries === 0 ? 'correct' : 'correct-second';
        if (isRetry) {
          cleared += 1;
        } else {
          answered += 1;
          if (tries === 0) { clean += 1; } else { second.push(pairIndex); }
        }
        var ok = result(status, choice, '', '');
        loadNext();
        ok.complete = done;
        return ok;
      }

      tries += 1;
      if (tries < triesAllowed) return result('retry', choice, '', '');

      var shown = current.answer;
      var note = noteFor(subject, pairIndex);
      var out = result('revealed', choice, shown, note);
      if (isRetry) {
        queue.push(pairIndex);   // comes around again on a later pass
      } else {
        answered += 1;
        missed.push(pairIndex);
      }
      loadNext();
      out.complete = done;
      return out;
    }

    function summary() {
      return {
        total: total,
        clean: clean,
        second: second.slice(),
        missed: missed.slice(),
        unclean: second.concat(missed)
      };
    }

    function progressText() {
      if (isRetry) {
        var left = queue.length + (current ? 1 : 0);
        return left === 1 ? '1 word left' : left + ' words left';
      }
      return 'Question ' + Math.min(answered + 1, total) + ' of ' + total;
    }

    loadNext();

    return {
      current: function () { return current; },
      answer: answer,
      summary: summary,
      progressText: progressText,
      isDone: function () { return done; },
      isRetry: function () { return isRetry; },
      mode: function () { return mode; }
    };
  }
```

Add to the exports at the bottom of the file:

```js
  globalThis.createRound = createRound;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./shared/vocab/tests/run.sh`
Expected: `quiz: 55 passed, 0 failed`, `validate` still passing.

If the count differs, count the `check(` calls in the file rather than assuming a bug — this number is bookkeeping, not behaviour. Any `FAIL` line is a real bug.

- [ ] **Step 5: Commit**

```bash
git add shared/vocab/quiz.js shared/vocab/tests/quiz.test.js
git commit -m "Give a main round two tries before revealing the answer"
```

---

### Task 5: Retry rounds and termination

A retry round runs the not-clean words from a main round until every one has been answered correctly. One try per showing; a miss reddens, reveals, and sends the word to the back of the queue. This is the task where a mistake produces an endless round rather than a visible bug, so termination is asserted directly.

**Files:**
- Modify: `shared/vocab/quiz.js` (only if a test fails; `createRound` from Task 4 already implements the retry branch)
- Test: `shared/vocab/tests/quiz.test.js` (append)

**Interfaces:**
- Consumes: `createRound` from Task 4, called with `{ retry: true, items: [...] }`
- Produces: no new exports. This task proves the retry branch behaves, and fixes it if it does not.

- [ ] **Step 1: Write the failing test**

Append to `shared/vocab/tests/quiz.test.js`, above the final `done('quiz');`:

```js
// ---------- retry rounds ----------

function retryRound(items, seed) {
  return createRound(FIXTURE, MODE_B_TO_A, { rng: makeRng(seed || 4),
                                             retry: true, items: items });
}

// --- one try only: a miss reveals immediately, no second chance
var rt = retryRound([0, 1, 2]);
var rq = rt.current();
var rmiss = rt.answer(wrongOption(rq));
check('retry miss reveals at once', rmiss.status, 'revealed');
check('retry miss shows the answer', rmiss.answer, rq.answer);
check('retry miss moves on', rt.isDone(), false);

// --- a missed word comes back on a later pass
var seenAgain = false, guard = 0;
while (!rt.isDone() && guard < 50) {
  var cur = rt.current();
  if (cur.pairIndex === rq.pairIndex) seenAgain = true;
  rt.answer(cur.answer);
  guard += 1;
}
check('a missed word comes back', seenAgain, true);
check('retry round ends once everything is clean', rt.isDone(), true);

// --- a cleared word never returns, however long the round runs
var rt2 = retryRound([0, 1, 2, 3], 9);
var firstPair = rt2.current().pairIndex;
rt2.answer(rt2.current().answer);   // cleared on the first pass
var reappeared = 0, guard2 = 0;
while (!rt2.isDone() && guard2 < 200) {
  var c2 = rt2.current();
  if (c2.pairIndex === firstPair) reappeared += 1;
  // miss everything once, then answer correctly, to force several passes
  if (guard2 < 4) { rt2.answer(wrongOption(c2)); } else { rt2.answer(c2.answer); }
  guard2 += 1;
}
check('a cleared word never returns', reappeared, 0);
check('the forced-miss round still ends', rt2.isDone(), true);

// --- termination: missing every word repeatedly still converges
var rt3 = retryRound([0, 1, 2, 3, 4, 5], 17);
var turns = 0;
while (!rt3.isDone() && turns < 500) {
  var c3 = rt3.current();
  // miss the first three showings of each word, then get it right
  if (turns < 18) { rt3.answer(wrongOption(c3)); } else { rt3.answer(c3.answer); }
  turns += 1;
}
check('a long retry round terminates', rt3.isDone(), true);
check('it took the expected number of turns', turns, 24);

// --- the counter counts words left, not questions asked
var rt4 = retryRound([0, 1, 2], 6);
check('counter starts at the list size', rt4.progressText(), '3 words left');
rt4.answer(wrongOption(rt4.current()));
check('a miss does not reduce the counter', rt4.progressText(), '3 words left');
rt4.answer(rt4.current().answer);
check('a correct answer reduces the counter', rt4.progressText(), '2 words left');
rt4.answer(rt4.current().answer);
check('the last word is singular', rt4.progressText(), '1 word left');

// --- a single-word retry round is answerable and terminates
var solo = retryRound([2], 8);
solo.answer(wrongOption(solo.current()));
check('a solo miss keeps the round alive', solo.isDone(), false);
check('the solo word comes straight back', solo.current().pairIndex, 2);
solo.answer(solo.current().answer);
check('the solo round ends', solo.isDone(), true);
```

- [ ] **Step 2: Run the test**

Run: `./shared/vocab/tests/run.sh`
Expected: all checks pass, because Task 4's `createRound` already implements the retry branch. Two outcomes are possible and both are informative:

- **All pass** — the retry rules are proven. Move to Step 4.
- **A check fails, or the suite hangs** — a hang means the requeue never drains, which is exactly the bug this task exists to catch. Fix `createRound` in Step 3.

If the suite hangs, interrupt it. The `guard` counters bound every loop in the test, so a hang means the engine itself is looping, not the test.

- [ ] **Step 3: Fix `createRound` if a check failed**

Only if Step 2 reported a failure. The three conditions that must hold in the retry branch:

1. A wrong answer with `triesAllowed === 1` takes the `tries >= triesAllowed` path on the first call — so `tries += 1` happens *before* the comparison.
2. The missed pair index is pushed onto `queue` **before** `loadNext()` runs, so it is behind everything still waiting.
3. A correct answer never pushes anything back onto `queue`.

Re-run Step 2 after the fix.

- [ ] **Step 4: Verify the whole engine suite**

Run: `./shared/vocab/tests/run.sh`
Expected: `validate` and `quiz` both report `0 failed`.

- [ ] **Step 5: Commit**

```bash
git add shared/vocab/quiz.js shared/vocab/tests/quiz.test.js
git commit -m "Prove a retry round drains and terminates"
```

---

### Task 6: Progress storage

Best score per mode and a per-word miss tally, so the end screen can say what keeps going wrong. Pure functions over plain objects; the caller does the `localStorage` reading and writing.

**Files:**
- Create: `shared/vocab/storage.js`
- Test: `shared/vocab/tests/storage.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `globalThis.storageKey(subject)` → `'study-time.<subject.id>.progress'`
  - `globalThis.emptyProgress()` → `{ version: 1, best: {}, misses: {} }`
  - `globalThis.parseProgress(json)` → a valid progress record, always
  - `globalThis.recordRound(progress, subject, mode, summary)` → a new progress record
  - `globalThis.bestScore(progress, mode)` → number, `0` when unset
  - `globalThis.troubleSpots(progress)` → `[{ text, misses }]`, most-missed first, ties broken alphabetically
  - `globalThis.serializeProgress(progress)` → JSON string

Misses are keyed by the pair's **side A string**, not its index: an index shifts if the word list is ever edited, and a stale tally pointing at the wrong word is worse than none.

- [ ] **Step 1: Write the failing test**

Create `shared/vocab/tests/storage.test.js`:

```js
load('tests/helpers.js');
load('tests/fixture.js');
load('storage.js');

// --- the key is derived from the subject, never hardcoded
check('key comes from the subject id', storageKey(FIXTURE),
      'study-time.fixture-1.progress');

// --- a fresh record
var fresh = emptyProgress();
check('fresh record has a version', fresh.version, 1);
check('fresh record has no best scores', Object.keys(fresh.best).length, 0);

// --- anything unreadable yields a fresh record rather than an error.
// Losing history is a nuisance; refusing to start is a broken evening.
check('null parses to empty', parseProgress(null).version, 1);
check('garbage parses to empty', parseProgress('{not json').version, 1);
check('an array parses to empty', parseProgress('[1,2]').version, 1);
check('a wrong version parses to empty',
      Object.keys(parseProgress('{"version":99,"best":{"x":5}}').best).length, 0);
check('a good record round-trips',
      parseProgress(serializeProgress({ version: 1, best: { 'a-to-b': 4 },
                                        misses: {} })).best['a-to-b'], 4);

// --- recording a round keeps the best score and tallies missed words
var summary = { total: 6, clean: 4, second: [0], missed: [1], unclean: [0, 1] };
var p1 = recordRound(emptyProgress(), FIXTURE, 'a-to-b', summary);
check('best score recorded', bestScore(p1, 'a-to-b'), 4);
check('other mode untouched', bestScore(p1, 'b-to-a'), 0);
check('second-try word tallied', p1.misses['a1'], 1);
check('missed word tallied', p1.misses['a2'], 1);
check('clean words are not tallied', p1.misses.hasOwnProperty('a3'), false);

// --- a worse round does not lower the best score, but still tallies
var worse = { total: 6, clean: 1, second: [], missed: [1], unclean: [1] };
var p2 = recordRound(p1, FIXTURE, 'a-to-b', worse);
check('a worse round keeps the best score', bestScore(p2, 'a-to-b'), 4);
check('misses accumulate', p2.misses['a2'], 2);

// --- a better round raises it
var better = { total: 6, clean: 6, second: [], missed: [], unclean: [] };
check('a better round raises the best score',
      bestScore(recordRound(p2, FIXTURE, 'a-to-b', better), 'a-to-b'), 6);

// --- recording does not mutate the record it was given
check('recordRound does not mutate its input', p1.misses['a2'], 1);

// --- trouble spots, worst first, ties alphabetical
var spots = troubleSpots(p2);
check('worst word first', spots[0].text, 'a2');
check('worst word count', spots[0].misses, 2);
check('all missed words listed', spots.length, 2);
check('no trouble spots in a fresh record', troubleSpots(emptyProgress()).length, 0);

done('storage');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./shared/vocab/tests/run.sh`
Expected: FAIL — `storage.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `shared/vocab/storage.js`:

```js
// Best score per mode and a per-word miss tally, kept in localStorage by the
// caller. Pure: takes and returns plain objects, never touches the browser.
(function () {
  var VERSION = 1;

  function storageKey(subject) {
    return 'study-time.' + subject.id + '.progress';
  }

  function emptyProgress() {
    return { version: VERSION, best: {}, misses: {} };
  }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !(v instanceof Array);
  }

  // Anything unexpected yields a fresh record. A study tool losing history is
  // a nuisance; a study tool refusing to start is a broken evening.
  function parseProgress(json) {
    if (!json) return emptyProgress();
    var data;
    try { data = JSON.parse(json); } catch (e) { return emptyProgress(); }
    if (!isPlainObject(data)) return emptyProgress();
    if (data.version !== VERSION) return emptyProgress();
    return {
      version: VERSION,
      best: isPlainObject(data.best) ? data.best : {},
      misses: isPlainObject(data.misses) ? data.misses : {}
    };
  }

  function copy(obj) {
    var out = {};
    for (var k in obj) { if (obj.hasOwnProperty(k)) out[k] = obj[k]; }
    return out;
  }

  // Words are tallied by their side A string. An index would shift the first
  // time the word list is edited, and a tally pointing at the wrong word is
  // worse than no tally at all.
  function recordRound(progress, subject, mode, summary) {
    var best = copy(progress.best);
    var misses = copy(progress.misses);
    if (!best.hasOwnProperty(mode) || summary.clean > best[mode]) {
      best[mode] = summary.clean;
    }
    for (var i = 0; i < summary.unclean.length; i++) {
      var text = subject.pairs[summary.unclean[i]].a;
      misses[text] = (misses[text] || 0) + 1;
    }
    return { version: VERSION, best: best, misses: misses };
  }

  function bestScore(progress, mode) { return progress.best[mode] || 0; }

  function troubleSpots(progress) {
    var out = [];
    for (var text in progress.misses) {
      if (progress.misses.hasOwnProperty(text) && progress.misses[text] > 0) {
        out.push({ text: text, misses: progress.misses[text] });
      }
    }
    out.sort(function (a, b) {
      return b.misses - a.misses || (a.text < b.text ? -1 : 1);
    });
    return out;
  }

  function serializeProgress(progress) { return JSON.stringify(progress); }

  globalThis.storageKey = storageKey;
  globalThis.emptyProgress = emptyProgress;
  globalThis.parseProgress = parseProgress;
  globalThis.recordRound = recordRound;
  globalThis.bestScore = bestScore;
  globalThis.troubleSpots = troubleSpots;
  globalThis.serializeProgress = serializeProgress;
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./shared/vocab/tests/run.sh`
Expected: `storage: 21 passed, 0 failed`, and `validate` and `quiz` still passing.

- [ ] **Step 5: Commit**

```bash
git add shared/vocab/storage.js shared/vocab/tests/storage.test.js
git commit -m "Keep best scores and a per-word miss tally"
```

---

### Task 7: The Spanish 10 word list

The subject's only content file. Transcribed verbatim from the answer key. **Copy the data below exactly** — the inconsistent trailing periods and the English parentheticals are in the key and are load-bearing, not sloppiness to tidy up.

**Files:**
- Create: `spanish-10/src/words.js`
- Create: `spanish-10/tests/run.sh`
- Test: `spanish-10/tests/words.test.js`

**Interfaces:**
- Consumes: `validateSubject` from `shared/vocab/validate.js`; `createRound`, `noteFor`, `makeRng`, `MODE_A_TO_B`, `MODE_B_TO_A` from `shared/vocab/quiz.js`
- Produces: `globalThis.SUBJECT`, the configuration object every shared module reads

- [ ] **Step 1: Write the word list**

Create `spanish-10/src/words.js`:

```js
// Lección preliminar, parts 1 and 2. Transcribed verbatim from the answer key.
//
// Two details that look like typos and are not:
//   - Trailing periods are inconsistent in the key ("Hasta luego" has none,
//     "Adiós." does). The key is the authority; do not normalize them.
//   - The English parentheticals are the only thing separating six otherwise
//     identical items: familiar from formal, and "your name" from "his/her
//     name". Removing them makes those questions unanswerable.
//
// The one correction: the guide prints "Encantado(a" with a truncated
// parenthesis.
globalThis.SUBJECT = {
  id: 'spanish-10',
  title: 'Spanish — Lección preliminar Quiz',
  subtitle: 'Parts 1 and 2 · greetings and introductions',
  sideA: { name: 'Spanish', lang: 'es' },
  sideB: { name: 'English', lang: 'en' },
  pairs: [
    { a: 'Hola.', b: 'Hello' },
    { a: 'Buenos días.', b: 'Good morning' },
    { a: 'Buenas tardes.', b: 'Good afternoon' },
    { a: 'Buenas noches.', b: 'Good night' },
    { a: 'Adiós.', b: 'Goodbye' },
    { a: 'Hasta luego', b: 'See you later' },
    { a: 'Hasta mañana.', b: 'See you tomorrow' },
    { a: '¿Cómo estás?', b: 'How are you? (familiar)' },
    { a: '¿Cómo está usted?', b: 'How are you? (formal)' },
    { a: '¿Qué tal?', b: "How's it going?" },
    { a: '¿Qué pasa?', b: "What's happening?" },
    { a: '¿Y tú?', b: 'and you (familiar)' },
    { a: '¿Y usted?', b: 'And you? (form.)' },
    { a: 'Bien.', b: 'well' },
    { a: 'Muy bien', b: 'very well' },
    { a: 'Regular.', b: 'okay' },
    { a: 'Más o menos.', b: 'so-so' },
    { a: 'malo/a', b: 'bad' },
    { a: '¿Cómo te llamas?', b: 'What is your name?' },
    { a: '¿Cómo se llama?', b: 'What is his/her name?' },
    { a: 'Me llamo', b: 'My name is' },
    { a: 'Se llama...', b: 'his/her name is' },
    { a: '¿Quién es?', b: 'Who is he/she/it?' },
    { a: 'Es...', b: 'he/she is' },
    { a: 'Te/Le presento a...', b: 'Let me introduce you (familiar/formal) to...' },
    { a: 'Mucho gusto', b: 'Nice to meet you' },
    { a: 'Encantado(a)', b: 'delighted' },
    { a: 'Igualmente.', b: 'Likewise' },
    { a: 'El gusto es mío.', b: 'The pleasure is mine' }
  ],
  // Shown after a second miss. These are the pairs where a wrong answer is
  // usually a real confusion rather than a blank, so "wrong" is not useful on
  // its own: the note names the distinction instead.
  confusables: [
    { members: ['Bien.', 'Muy bien'],
      note: 'Bien. is "well." Muy bien adds muy, "very" — "very well."' },
    { members: ['Regular.', 'Más o menos.'],
      note: 'Both are middling answers. On this quiz Regular. is "okay" and Más o menos. is "so-so."' },
    { members: ['¿Qué tal?', '¿Qué pasa?'],
      note: '¿Qué tal? asks how things are going. ¿Qué pasa? asks what is happening.' },
    { members: ['Mucho gusto', 'Igualmente.', 'El gusto es mío.', 'Encantado(a)'],
      note: 'All four belong to an introduction. Mucho gusto is "nice to meet you," Igualmente. is "likewise," El gusto es mío. is "the pleasure is mine," and Encantado(a) is "delighted."' },
    { members: ['¿Cómo estás?', '¿Cómo está usted?'],
      note: 'Both ask how someone is. ¿Cómo estás? is familiar — for a friend. ¿Cómo está usted? is formal, and usted is the giveaway.' },
    { members: ['¿Y tú?', '¿Y usted?'],
      note: 'Both mean "and you?" Tú is familiar; usted is formal.' },
    { members: ['¿Cómo te llamas?', '¿Cómo se llama?'],
      note: 'Te asks the person in front of you: "what is your name?" Se asks about someone else: "what is his/her name?"' },
    { members: ['Me llamo', 'Se llama...'],
      note: 'Me llamo is "my name is." Se llama... is "his/her name is." Me is about me, se is about someone else.' }
  ]
};
```

- [ ] **Step 2: Write the subject test suite**

Create `spanish-10/tests/run.sh` (then `chmod +x`):

```sh
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
```

Create `spanish-10/tests/words.test.js`:

```js
load('../shared/vocab/tests/helpers.js');
load('../shared/vocab/validate.js');
load('../shared/vocab/quiz.js');
load('src/words.js');

// --- the word list survives the shared validator
check('word list is valid', validateSubject(SUBJECT).join(' | '), '');
check('the study guide has 29 pairs', SUBJECT.pairs.length, 29);

function english(spanish) {
  for (var i = 0; i < SUBJECT.pairs.length; i++) {
    if (SUBJECT.pairs[i].a === spanish) return SUBJECT.pairs[i].b;
  }
  return '(not found)';
}

// --- spot checks against the answer key
check('Hola.', english('Hola.'), 'Hello');
check('Adiós.', english('Adiós.'), 'Goodbye');
check('Se llama...', english('Se llama...'), 'his/her name is');
check('Te/Le presento a...', english('Te/Le presento a...'),
      'Let me introduce you (familiar/formal) to...');
check('malo/a', english('malo/a'), 'bad');

// --- the parentheticals are the only thing separating these six items.
// Without them the questions have two right answers and cannot be answered.
check('familiar estás', english('¿Cómo estás?'), 'How are you? (familiar)');
check('formal usted', english('¿Cómo está usted?'), 'How are you? (formal)');
check('familiar tú', english('¿Y tú?'), 'and you (familiar)');
check('formal y usted', english('¿Y usted?'), 'And you? (form.)');
check('your name', english('¿Cómo te llamas?'), 'What is your name?');
check('his or her name', english('¿Cómo se llama?'), 'What is his/her name?');

// --- the key's punctuation is preserved exactly as printed
check('Hasta luego carries no period', english('Hasta luego'), 'See you later');
check('Encantado(a) closes its parenthesis',
      english('Encantado(a)'), 'delighted');

// --- every confusable cluster resolves to a note
var unnoted = 0;
for (var c = 0; c < SUBJECT.confusables.length; c++) {
  var members = SUBJECT.confusables[c].members;
  for (var m = 0; m < members.length; m++) {
    var idx = -1;
    for (var p = 0; p < SUBJECT.pairs.length; p++) {
      if (SUBJECT.pairs[p].a === members[m]) idx = p;
    }
    if (idx === -1 || noteFor(SUBJECT, idx) === '') unnoted += 1;
  }
}
check('every clustered word has a note', unnoted, 0);
check('eight clusters declared', SUBJECT.confusables.length, 8);

// --- a full round in each direction is answerable end to end
var modes = [MODE_A_TO_B, MODE_B_TO_A];
for (var mi = 0; mi < modes.length; mi++) {
  var round = createRound(SUBJECT, modes[mi], { rng: makeRng(31 + mi) });
  var asked = 0;
  while (!round.isDone() && asked < 200) {
    round.answer(round.current().answer);
    asked += 1;
  }
  check('a full round covers 29 questions in ' + modes[mi], asked, 29);
  check('a clean round scores 29 in ' + modes[mi], round.summary().clean, 29);
}

done('words');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `./spanish-10/tests/run.sh`
Expected: FAIL if `words.js` was mistyped — most likely `word list is valid` printing the exact duplicate or whitespace problem, or a spot check naming the pair that does not match the key.

- [ ] **Step 4: Fix any transcription errors and re-run**

Run: `./spanish-10/tests/run.sh`
Expected: `words: 21 passed, 0 failed`

Then re-run the engine suite to be sure nothing shared regressed:

Run: `./shared/vocab/tests/run.sh`
Expected: `0 failed` in all three suites.

- [ ] **Step 5: Commit**

```bash
git add spanish-10/src/words.js spanish-10/tests
git commit -m "Add the Leccion preliminar word list and its checks"
```

---

### Task 8: Page shell, menu screen, and quiz screen

The first task with DOM. `views.js` is the only file in the framework allowed to touch `document`, which is what keeps everything else testable under `jsc`. It renders three screens into a single mount point, so a new subject never writes markup.

This task delivers a playable round with a placeholder end screen; Task 9 replaces that placeholder with the real one.

**Files:**
- Create: `shared/vocab/views.js`
- Create: `shared/vocab/vocab.css`
- Create: `spanish-10/src/app.html`
- Create: `spanish-10/src/manifest.txt`
- Create: `spanish-10/src/styles.txt`
- Generated: `spanish-10/index.html`

**Interfaces:**
- Consumes: `SUBJECT` (Task 7); `createRound`, `MODE_A_TO_B`, `MODE_B_TO_A`, `OPTION_COUNT` (Tasks 3–5); `storageKey`, `parseProgress`, `recordRound`, `bestScore`, `troubleSpots`, `serializeProgress` (Task 6)
- Produces: nothing other modules consume. `views.js` is the top of the stack and must be last in the manifest.

- [ ] **Step 1: Write the subject plumbing**

Create `spanish-10/src/app.html`. It is deliberately almost empty — every screen is rendered by the shared `views.js`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Spanish — Lección preliminar Quiz</title>
<style>{{CSS}}</style>
</head>
<body>
<main id="app"></main>
<script>{{JS}}</script>
</body>
</html>
```

Create `spanish-10/src/manifest.txt`. Paths are relative to `spanish-10/src/`, so `../../` reaches the repository root. `views.js` must come last, and `words.js` must come before anything that reads `SUBJECT`:

```
# JS modules, in load order. Shared engine first, then this subject's data,
# then the views that read both. Paths are relative to this src/ directory.
../../shared/vocab/quiz.js
../../shared/vocab/storage.js
words.js
../../shared/vocab/views.js
```

Create `spanish-10/src/styles.txt`:

```
# Stylesheets, in order. Paths are relative to this src/ directory.
../../shared/vocab/vocab.css
```

- [ ] **Step 2: Write the stylesheet**

Create `shared/vocab/vocab.css`. It follows the visual language `geometry-10/src/app.css` established — system font, single column, `color-scheme: light dark` — so the two tools look like one project. Option buttons are large enough to hit on a tablet.

```css
:root { color-scheme: light dark; --ok: #1a7f37; --no: #b3261e; --warn: #a26a00; }
body {
  font: 16px/1.6 system-ui, -apple-system, sans-serif;
  max-width: 40rem; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;
}
h1 { font-size: 1.5rem; margin-bottom: .25rem; }
h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em;
     opacity: .6; margin-top: 2rem; }
.crumb { font-size: .875rem; }
.crumb a { color: inherit; opacity: .7; }
.sub { opacity: .7; margin-top: 0; }
.modes { list-style: none; padding: 0; }
.modes button {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 1rem; width: 100%; padding: .9rem 1rem; margin-bottom: .6rem;
  font: inherit; text-align: left; background: none; color: inherit;
  border: 1px solid currentColor; border-radius: .5rem; cursor: pointer;
}
.modes button:hover { background: rgba(128,128,128,.12); }
.modes .best { font-size: .8rem; opacity: .6; white-space: nowrap; }
.primary, .secondary {
  font: inherit; padding: .7rem 1.4rem; margin: .25rem .5rem .25rem 0;
  border-radius: .5rem; border: 1px solid currentColor; background: none;
  color: inherit; cursor: pointer;
}
.secondary { opacity: .7; }
#progress { font-size: .8rem; text-transform: uppercase;
            letter-spacing: .08em; opacity: .6; }
.prompt { font-size: 1.9rem; line-height: 1.25; margin: .75rem 0 1.5rem; }
.options { list-style: none; padding: 0; margin: 0; }
.options button {
  display: block; width: 100%; padding: .85rem 1rem; margin-bottom: .6rem;
  font: inherit; font-size: 1.05rem; text-align: left; background: none;
  color: inherit; border: 1px solid currentColor; border-radius: .5rem;
  cursor: pointer;
}
.options button:hover:not(:disabled) { background: rgba(128,128,128,.12); }
.options button:disabled { cursor: default; }
.options button.wrong {
  border-color: var(--no); color: var(--no); opacity: 1;
  background: rgba(179,38,30,.08);
}
.options button.right {
  border-color: var(--ok); color: var(--ok); font-weight: 600;
  background: rgba(26,127,55,.08);
}
.options button.faded:disabled { opacity: .4; }
#feedback { min-height: 3.5rem; margin: 1rem 0 .5rem; }
#feedback .verdict { font-weight: 600; }
#feedback .verdict.good { color: var(--ok); }
#feedback .verdict.bad { color: var(--no); }
#feedback .note {
  display: block; margin-top: .4rem; font-size: .95rem; opacity: .85;
}
.score { font-size: 2.5rem; margin: .5rem 0 0; }
.score small { font-size: 1rem; opacity: .6; display: block; }
.review { list-style: none; padding: 0; }
.review li {
  padding: .55rem .75rem; margin-bottom: .4rem; border-radius: .4rem;
  border-left: 4px solid transparent; background: rgba(128,128,128,.08);
}
.review li.second { border-left-color: var(--warn); }
.review li.missed { border-left-color: var(--no); }
.review .term { font-weight: 600; }
.review .gloss { opacity: .75; }
.review .tag { float: right; font-size: .75rem; text-transform: uppercase;
               letter-spacing: .06em; opacity: .6; }
.trouble { list-style: none; padding: 0; font-size: .9rem; }
.trouble li { padding: .15rem 0; opacity: .8; }
```

- [ ] **Step 3: Write the views module**

Create `shared/vocab/views.js`. Nothing here names a language: every label comes from `SUBJECT`.

```js
// All DOM. Every other module in the framework is DOM-free and unit tested.
// Nothing here knows what the subject is: labels come from SUBJECT.sideA and
// SUBJECT.sideB, so the same file serves a language quiz and a science one.
(function () {
  var CORRECT_PAUSE_MS = 650;

  var app = document.getElementById('app');
  var round = null;
  var progress = loadProgress();
  var pending = null;   // timer id for the pause after a correct answer

  function loadProgress() {
    try {
      return parseProgress(window.localStorage.getItem(storageKey(SUBJECT)));
    } catch (e) {
      return emptyProgress();
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(storageKey(SUBJECT),
                                  serializeProgress(progress));
    } catch (e) { /* private browsing, a full disk: not worth interrupting */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function modeLabel(mode) {
    var keys = sideKeys(mode);
    var from = keys.prompt === 'a' ? SUBJECT.sideA : SUBJECT.sideB;
    var to = keys.answer === 'a' ? SUBJECT.sideA : SUBJECT.sideB;
    return from.name + ' → ' + to.name;
  }

  function langOf(side) {
    return (side === 'a' ? SUBJECT.sideA : SUBJECT.sideB).lang || 'en';
  }

  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
  }

  // ---------- menu ----------

  function renderMenu() {
    clearPending();
    round = null;
    var modes = [MODE_A_TO_B, MODE_B_TO_A];
    var html = '<p class="crumb"><a href="../index.html">← All topics</a></p>' +
      '<h1>' + escapeHtml(SUBJECT.title) + '</h1>' +
      '<p class="sub">' + escapeHtml(SUBJECT.subtitle || '') + '</p>' +
      '<h2>Choose a direction</h2><ul class="modes">';
    for (var i = 0; i < modes.length; i++) {
      var best = bestScore(progress, modes[i]);
      html += '<li><button type="button" data-mode="' + modes[i] + '">' +
        '<span>' + escapeHtml(modeLabel(modes[i])) + '</span>' +
        '<span class="best">' +
        (best ? 'Best ' + best + ' of ' + SUBJECT.pairs.length : 'Not tried yet') +
        '</span></button></li>';
    }
    html += '</ul>';

    var spots = troubleSpots(progress).slice(0, 5);
    if (spots.length) {
      html += '<h2>Worth reviewing</h2><ul class="trouble">';
      for (var s = 0; s < spots.length; s++) {
        html += '<li>' + escapeHtml(spots[s].text) + ' · missed ' +
                spots[s].misses + (spots[s].misses === 1 ? ' time' : ' times') +
                '</li>';
      }
      html += '</ul>';
    }
    app.innerHTML = html;

    var buttons = app.querySelectorAll('.modes button');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', function (ev) {
        startRound(ev.currentTarget.getAttribute('data-mode'), null);
      });
    }
  }

  // ---------- quiz ----------

  function startRound(mode, items) {
    clearPending();
    round = createRound(SUBJECT, mode, {
      items: items,
      retry: !!items
    });
    renderQuestion();
  }

  function renderQuestion() {
    var q = round.current();
    if (!q) { renderDone(); return; }
    var keys = sideKeys(round.mode());
    var html = '<p class="crumb"><a href="#" id="to-menu">← Menu</a></p>' +
      '<p id="progress">' + escapeHtml(round.progressText()) + '</p>' +
      '<p class="prompt" lang="' + langOf(keys.prompt) + '">' +
      escapeHtml(q.prompt) + '</p><ul class="options">';
    for (var i = 0; i < q.options.length; i++) {
      html += '<li><button type="button" class="option" data-index="' + i +
        '" lang="' + langOf(keys.answer) + '">' +
        escapeHtml(q.options[i]) + '</button></li>';
    }
    html += '</ul><p id="feedback" aria-live="polite"></p>';
    app.innerHTML = html;

    document.getElementById('to-menu').addEventListener('click', function (ev) {
      ev.preventDefault();
      renderMenu();
    });
    var buttons = app.querySelectorAll('.option');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', onChoose);
    }
    if (buttons.length) buttons[0].focus();
  }

  function optionButtons() { return app.querySelectorAll('.option'); }

  function buttonFor(text) {
    var buttons = optionButtons();
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent === text) return buttons[i];
    }
    return null;
  }

  function disableAll(fade) {
    var buttons = optionButtons();
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (fade && !buttons[i].className.match(/wrong|right/)) {
        buttons[i].className += ' faded';
      }
    }
  }

  function setFeedback(html) {
    document.getElementById('feedback').innerHTML = html;
  }

  function onChoose(ev) {
    var button = ev.currentTarget;
    if (button.disabled) return;
    var chosen = button.textContent;
    var result = round.answer(chosen);

    if (result.status === 'retry') {
      // The question stays up. Only the wrong choice is taken away.
      button.className = 'option wrong';
      button.disabled = true;
      setFeedback('<span class="verdict bad">Not that one.</span> ' +
                  'Try again — one more go.');
      var remaining = optionButtons();
      for (var i = 0; i < remaining.length; i++) {
        if (!remaining[i].disabled) { remaining[i].focus(); break; }
      }
      return;
    }

    if (result.correct) {
      button.className = 'option right';
      disableAll(true);
      setFeedback('<span class="verdict good">' +
                  (result.status === 'correct' ? 'Correct.' : 'Right — second try.') +
                  '</span>');
      pending = window.setTimeout(function () {
        pending = null;
        renderQuestion();
      }, CORRECT_PAUSE_MS);
      return;
    }

    // Revealed: out of tries in a main round, or a miss in a retry round.
    button.className = 'option wrong';
    var right = buttonFor(result.answer);
    if (right) right.className = 'option right';
    disableAll(true);
    setFeedback('<span class="verdict bad">The answer is ' +
                escapeHtml(result.answer) + '.</span>' +
                (result.note ? '<span class="note">' + escapeHtml(result.note) +
                 '</span>' : '') +
                '<button type="button" class="primary" id="next">Next</button>');
    document.getElementById('next').addEventListener('click', renderQuestion);
    document.getElementById('next').focus();
  }

  // ---------- done (placeholder, replaced in the next task) ----------

  function renderDone() {
    var summary = round.summary();
    app.innerHTML = '<h1>Round complete</h1><p class="score">' +
      summary.clean + '<small>of ' + summary.total + ' clean</small></p>' +
      '<button type="button" class="primary" id="to-menu-2">Back to menu</button>';
    document.getElementById('to-menu-2').addEventListener('click', renderMenu);
  }

  document.title = SUBJECT.title;
  renderMenu();
})();
```

- [ ] **Step 4: Build and verify the page**

Run: `python3 tools/build.py spanish-10`
Expected: `wrote spanish-10/index.html (NN.N KB)`

Run: `grep -c 'Encantado(a)' spanish-10/index.html && grep -c 'renderQuestion' spanish-10/index.html && grep -c 'vocab.css\|options button' spanish-10/index.html`
Expected: non-zero counts for all three — the word list, the views, and the shared stylesheet all made it into the single file.

Run: `grep -ci 'spanish' shared/vocab/*.js`
Expected: `0` for every shared file. The engine must not name the subject.

- [ ] **Step 5: Verify it in a browser**

Run: `open spanish-10/index.html`

Confirm by hand:
1. The menu shows two buttons, **Spanish → English** and **English → Spanish**, each saying "Not tried yet".
2. Starting a round shows "Question 1 of 29", a large Spanish prompt, and four English options.
3. Clicking a wrong option turns it red, leaves the other three clickable, and says "Not that one. Try again — one more go." **The question does not advance.**
4. Clicking the right option on that second try says "Right — second try." and moves on by itself after a beat.
5. Clicking two wrong options reveals the correct answer in green with a **Next** button. For a confusable word such as `¿Cómo estás?`, the distinction note appears under the verdict.
6. "← Menu" returns to the menu; "← All topics" is present (its target does not exist until Task 10).
7. Answering all 29 reaches the placeholder "Round complete" screen.

- [ ] **Step 6: Commit**

```bash
git add shared/vocab/views.js shared/vocab/vocab.css spanish-10/src spanish-10/index.html
git commit -m "Render the menu and a playable round"
```

---

### Task 9: The end screen and the retry round

Replace the placeholder with the real end screen: a score, a two-tier review list, and the button that starts a retry round. This is also where progress is written to `localStorage`.

**Files:**
- Modify: `shared/vocab/views.js`
- Generated: `spanish-10/index.html`

**Interfaces:**
- Consumes: `round.summary()` → `{ total, clean, second, missed, unclean }` (Task 4); `recordRound`, `serializeProgress` (Task 6)
- Produces: no new exports

- [ ] **Step 1: Replace `renderDone`**

In `shared/vocab/views.js`, replace the placeholder `renderDone` with the version below, and add the two helpers above it.

```js
  // ---------- done ----------

  function pairRow(index, tier) {
    var pair = SUBJECT.pairs[index];
    var tag = tier === 'second' ? 'second try' : 'missed';
    return '<li class="' + tier + '"><span class="tag">' + tag + '</span>' +
      '<span class="term" lang="' + langOf('a') + '">' +
      escapeHtml(pair.a) + '</span> — ' +
      '<span class="gloss" lang="' + langOf('b') + '">' +
      escapeHtml(pair.b) + '</span></li>';
  }

  function reviewList(summary) {
    if (!summary.unclean.length) return '';
    var html = '<h2>Review these</h2><ul class="review">';
    for (var s = 0; s < summary.second.length; s++) {
      html += pairRow(summary.second[s], 'second');
    }
    for (var m = 0; m < summary.missed.length; m++) {
      html += pairRow(summary.missed[m], 'missed');
    }
    return html + '</ul>';
  }

  function renderDone() {
    clearPending();
    var summary = round.summary();
    var wasRetry = round.isRetry();
    var mode = round.mode();

    // Only main rounds are scored. A retry round covers a different, smaller
    // list, so its "score" is not comparable and would corrupt the best.
    if (!wasRetry) {
      progress = recordRound(progress, SUBJECT, mode, summary);
      saveProgress();
    }

    var html = '<p class="crumb"><a href="#" id="to-menu">← Menu</a></p>';
    if (wasRetry) {
      html += '<h1>All caught up</h1>' +
        '<p>Every word on the list answered correctly — ' +
        summary.total + (summary.total === 1 ? ' word' : ' words') + '.</p>';
    } else {
      html += '<h1>Round complete</h1>' +
        '<p class="score">' + summary.clean +
        '<small>of ' + summary.total + ' right on the first try</small></p>';
      if (summary.second.length) {
        html += '<p>' + summary.second.length +
          (summary.second.length === 1 ? ' took' : ' took') +
          ' a second try.</p>';
      }
      html += reviewList(summary);
    }

    html += '<p>';
    if (!wasRetry && summary.unclean.length) {
      html += '<button type="button" class="primary" id="retry">' +
        'Retry the ' + summary.unclean.length + ' you missed</button>';
    }
    html += '<button type="button" class="secondary" id="again">' +
      (wasRetry ? 'Back to menu' : 'Run the whole list again') + '</button></p>';
    app.innerHTML = html;

    document.getElementById('to-menu').addEventListener('click', function (ev) {
      ev.preventDefault();
      renderMenu();
    });
    var retry = document.getElementById('retry');
    if (retry) {
      var items = summary.unclean.slice();
      retry.addEventListener('click', function () { startRound(mode, items); });
      retry.focus();
    }
    document.getElementById('again').addEventListener('click', function () {
      if (wasRetry) { renderMenu(); } else { startRound(mode, null); }
    });
  }
```

- [ ] **Step 2: Rebuild**

Run: `python3 tools/build.py spanish-10`
Expected: `wrote spanish-10/index.html (NN.N KB)`

- [ ] **Step 3: Verify the end screen and the retry loop in a browser**

Run: `open spanish-10/index.html`

Play a deliberately imperfect round — the fastest way is to answer a handful wrong on purpose and the rest right. Confirm:

1. The score reads "N of 29 right on the first try" and counts only clean answers.
2. "Review these" lists second-try words first with an amber left edge and a "second try" tag, then missed words with a red left edge and a "missed" tag. Each row shows the Spanish and the English.
3. The button reads "Retry the N you missed" with N matching the list length, including the second-try rows.
4. In the retry round the counter reads "N words left". A wrong answer reveals immediately with **no second try**, and the round does not end.
5. A word missed in retry **comes back** on a later pass; a word answered correctly **never comes back**.
6. The retry round ends only when every word has been answered correctly, on the "All caught up" screen.
7. Returning to the menu shows "Best N of 29" on the mode just played, and a "Worth reviewing" list naming the words that were missed.
8. Reload the page: the best score and the review list survive.
9. A clean 29 of 29 round shows no review list and no retry button.

- [ ] **Step 4: Re-run every suite**

Run: `./shared/vocab/tests/run.sh && ./spanish-10/tests/run.sh && ./geometry-10/tests/run.sh && ./tools/tests/build.test.sh`
Expected: `0 failed` everywhere, including geometry, which this plan must not disturb.

- [ ] **Step 5: Commit**

```bash
git add shared/vocab/views.js spanish-10/index.html
git commit -m "Show what was missed and drill it until it sticks"
```

---

### Task 10: Landing page and documentation

The tool is not reachable until the landing page links to it, and the framework is not reusable until the recipe is written down. Both are the point of the exercise.

**Files:**
- Modify: `src/app.html`
- Modify: `README.md`
- Create: `shared/vocab/README.md`
- Generated: `index.html`

**Interfaces:**
- Consumes: nothing
- Produces: nothing

- [ ] **Step 1: Add the landing page entry**

In `src/app.html`, inside the 10th Grade `<ul class="topics">`, after the geometry `<li>`, add:

```html
    <li><a href="spanish-10/index.html">
      <strong>Spanish — Lección preliminar Quiz</strong>
      <span>Greetings and introductions: 29 words and phrases, both directions</span>
    </a></li>
```

Leave the 8th Grade section exactly as it is. That is where the next subject lands.

- [ ] **Step 2: Rebuild the landing page**

Run: `python3 tools/build.py .`
Expected: `wrote ./index.html (N.N KB)`

Run: `open index.html`
Expected: two topics under 10th Grade; the Spanish link opens the quiz.

- [ ] **Step 3: Write the framework README**

Create `shared/vocab/README.md`:

````markdown
# Vocabulary quiz engine

A two-mode multiple-choice vocabulary quiz. Point it at a word list and it
produces a study tool; it never needs to know what the words mean.

A subject is one data file and three lines of plumbing. Adding one should take
about ten minutes and no engine changes at all.

## How a round works

A round walks every pair once, shuffled. Each question shows one side of a pair
and four options from the other side: the answer plus three distractors drawn
at random from the whole pool — near-synonyms included, on purpose, because
telling those apart is what a vocabulary quiz tests.

- **Main round.** Two tries. A first miss reddens that option and leaves the
  question up. A second miss reveals the answer, with the subject's distinction
  note if the word belongs to a confusable cluster, and moves on. Every pair
  ends as *clean*, *second-try*, or *missed*.
- **End screen.** The score counts clean answers only. Everything else is listed
  in two tiers — second-try in amber, missed in red — and seeds the retry round.
- **Retry round.** One try per showing. A miss reveals and sends the word to the
  back of the queue; it comes around again later. The round ends only when every
  word has been answered correctly once.

## Adding a subject

1. `mkdir -p <subject>/src <subject>/tests`
2. Write `<subject>/src/words.js` defining `globalThis.SUBJECT` (shape below).
3. Copy `<subject>/src/app.html` from `spanish-10/src/app.html`, changing only
   the `<title>`.
4. Copy `<subject>/src/manifest.txt` and `<subject>/src/styles.txt` from
   `spanish-10/src/` unchanged. Paths are relative to `src/`, so `../../`
   reaches the repository root.
5. Copy `<subject>/tests/run.sh` from `spanish-10/tests/run.sh`, and write
   `<subject>/tests/words.test.js` — at minimum, call `validateSubject(SUBJECT)`
   and assert it returns nothing, plus spot checks against the answer key.
6. `./<subject>/tests/run.sh`
7. `python3 tools/build.py <subject>`
8. Add a `<li>` to `src/app.html` under the right grade, then
   **`python3 tools/build.py .`** — the landing page is a separate build step
   and is the thing most often forgotten.
9. Add a row to the root `README.md` table.

## The SUBJECT shape

```js
globalThis.SUBJECT = {
  id: 'spanish-8',                  // storage key is study-time.<id>.progress
  title: 'Spanish — Unit 2 Quiz',   // page title and heading
  subtitle: 'Classroom objects',    // optional line under the heading
  sideA: { name: 'Spanish', lang: 'es' },
  sideB: { name: 'English', lang: 'en' },
  pairs: [
    { a: 'la mochila', b: 'the backpack' }
  ],
  confusables: [                    // optional
    { members: ['la mochila', 'la bolsa'],
      note: 'Why these two get mixed up, in one sentence.' }
  ]
};
```

`sideA` and `sideB` name the two directions and set the `lang` attribute on
rendered text. They are not required to be languages: a science subject can use
`{ name: 'Term' }` and `{ name: 'Definition' }`, and the mode buttons read
**Term → Definition** and **Definition → Term**.

`confusables.members` are **side A strings**. The note is shown after a second
miss, so write it as the sentence a tutor would say — name the distinction,
don't restate the answer.

## Rules that are not negotiable

- **Transcribe from the answer key verbatim.** Inconsistent trailing periods
  and parenthetical qualifiers like `(familiar)` are usually load-bearing:
  in `spanish-10` they are the only thing distinguishing six otherwise
  identical items. Tidying them up destroys those questions.
- **Never commit anything under `reference/`.** It is gitignored because it
  holds scanned teacher materials with handwritten student names. This
  repository is public.
- **No student names anywhere** — paths, page copy, commit messages, docs.
- **No subject-specific word belongs in `shared/vocab/`.** Sides are `a` and
  `b`; every label comes from `SUBJECT`. `grep -i spanish shared/vocab/*.js`
  must stay empty.
- **`index.html` is generated.** Edit `src/`, then build.

## Files

| File | Responsibility |
| --- | --- |
| `quiz.js` | Seeded RNG, question construction, round state, two-try and retry rules |
| `storage.js` | Progress records; the key is derived from `SUBJECT.id` |
| `validate.js` | Word-list checks, called from each subject's test suite |
| `views.js` | Every DOM touch: menu, quiz, and end screens |
| `vocab.css` | The whole look |

Everything except `views.js` is DOM-free, which is what lets the suite run
without a browser.

## Tests

```sh
./shared/vocab/tests/run.sh     # the engine
./spanish-10/tests/run.sh       # one subject's word list
```

Both run under `jsc`, which ships with macOS; there is no Node on the target
machine. `check()` compares with `===`, so assert scalars — lengths, joined
strings, booleans — never arrays or objects.

Two tests carry the framework's weight. `validate.test.js` turns a
transcription typo into a build failure instead of a question with two right
answers. The retry section of `quiz.test.js` proves the requeue drains: an
off-by-one there produces a round that never ends, which no amount of clicking
through would reveal.
````

- [ ] **Step 4: Update the root README**

In `README.md`, add a row to the "What's here" table under the geometry row:

```markdown
| `spanish-10/` | 10th | Lección preliminar quiz: greetings and introductions, 29 words and phrases |
```

Add this section after the Geometry section:

```markdown
## Spanish — Lección preliminar Quiz

Two modes, the same 29 pairs in both directions:

- **Spanish → English** — the prompt is Spanish, the four options are English
- **English → Spanish** — the other way round

Every round shuffles all 29 and asks each exactly once. The three wrong options
are drawn at random from the rest of the word bank, near-synonyms included:
`Regular.` and `Más o menos.` landing in the same question is the point, not a
bug.

A first miss reddens that option and leaves the question up for a second try. A
second miss reveals the answer — and when the word belongs to a cluster that is
genuinely easy to confuse, it names the distinction rather than just saying
"wrong": *"Both ask how someone is. ¿Cómo estás? is familiar — for a friend.
¿Cómo está usted? is formal, and usted is the giveaway."*

The end screen scores only the clean answers and lists everything else in two
tiers: amber for words that took a second try, red for words missed outright.
**Retry the ones you missed** drills that list one try per showing, sending
misses to the back of the queue, and ends only when every word has been
answered correctly.

This tool is built on the reusable engine in `shared/vocab/`. Adding another
vocabulary subject — another language, or English and science terms — needs a
word list and three lines of plumbing, not another implementation. See
[`shared/vocab/README.md`](shared/vocab/README.md).
```

In the "How it's built" section, add after the existing build commands:

```markdown
    python3 tools/build.py spanish-10   # rebuild the Spanish tool
    ./shared/vocab/tests/run.sh         # run the vocabulary engine tests
    ./spanish-10/tests/run.sh           # run the Spanish word list checks
    ./tools/tests/build.test.sh         # run the build script's own test
```

And add to "Notes for whoever changes this next":

```markdown
- **Vocabulary quizzes share one engine.** `shared/vocab/` holds the whole
  thing; a subject is a word list plus three lines of plumbing. Read
  `shared/vocab/README.md` before starting one, and don't put a subject's
  vocabulary — or its language — into the shared files.
```

- [ ] **Step 5: Verify nothing from `reference/` is staged**

Run: `git status --porcelain --ignored | grep reference`
Expected: only `!!` (ignored) lines. If any `reference/` path shows as staged or untracked-but-not-ignored, stop and fix `.gitignore` before committing.

- [ ] **Step 6: Commit**

```bash
git add README.md shared/vocab/README.md src/app.html index.html
git commit -m "Link the Spanish tool and write down how to add the next subject"
```

---

## Final verification

Run every suite and both builds one last time:

```sh
./shared/vocab/tests/run.sh
./spanish-10/tests/run.sh
./geometry-10/tests/run.sh
./tools/tests/build.test.sh
python3 tools/build.py spanish-10
python3 tools/build.py geometry-10
python3 tools/build.py .
git status --short
```

Expected: `0 failed` in every suite, three "wrote" lines, and **no modification
to `geometry-10/index.html`** — this plan does not touch that tool.

Then open `index.html`, click through to the Spanish quiz, and play one full
round in each direction plus one retry round.
