# Study Time: landing page + Geometry Algebra Review

Design doc — 2026-08-18

## Purpose

A repository of browser-based study tools, one per test or topic, reachable
from a single landing page. The first tool covers the algebra review material
for Geometry Test #1 (10th grade), drawn from two completed paper study guides.

The tool asks one question at a time. Multi-step algebra problems are worked as
a sequence of fill-in-the-blank steps rather than a single answer box, so a
wrong turn is caught at the step where it happens.

## Constraints

**The repository is public.** No student names appear in any tracked file —
not in paths, the landing page, the app, the README, or commit messages.
Organization is by grade instead of by student; with one child per grade the
grouping is identical in practice.

**The scanned study guides are never committed.** `.gitignore` contains
`**/reference/`. The PDFs carry a student name in handwriting and are the
teacher's materials. Verify with `git check-ignore -v` before any push.

The committer identity places the repository owner's own surname and email in
the git history of every commit. That is their name and their decision, and it
is accepted — but it does mean the family surname is discoverable from the
history even though no tracked file contains it.

**Everything works offline by double-click.** No server, no build step at view
time, no network. Each tool is a single generated `index.html`; the landing page
links to them with relative paths, which resolve under `file://`.

## Layout

```
study-time/
  index.html                 generated landing page
  src/                       landing page source (app.html, app.css)
  tools/build.py             shared: inlines src/ into an index.html
  geometry-10/
    index.html               generated app
    src/                     app modules
    tests/                   jsc test suite
    reference/               the PDFs — gitignored, local only
  docs/superpowers/specs/
```

Only `geometry-10/reference/`, `.gitignore`, and this spec exist today. Every
other path above is to be created.

Topic folders are named `<subject>-<grade>`. `geometry-10` already fits.
Future 8th grade topics become `<subject>-08`. The landing page groups them under
**10th Grade** and **8th Grade** headings; the 8th grade section renders an
empty state until a topic exists.

## Question types

Eight types appear in the source material. They do not share an input widget,
which is what sets the module boundaries.

| # | Type | Answer shape | Source |
| --- | --- | --- | --- |
| 1 | Label the coordinate plane | axis / origin / quadrant targets | P1 #1 |
| 2 | Sign of x and y per quadrant | four (±, ±) pairs | P1 #2 |
| 3 | Read x- and y-intercepts off a graphed line | two ordered pairs | P1 #3, P2 #1 |
| 4 | Solve a multi-step linear equation | integer or fraction | P1 #4–9, P2 #2–9 |
| 5 | Evaluate an expression at given values | integer | P1 #10–11, P2 #10 |
| 6 | Multiply or divide fractions, fully simplified | reduced fraction | P1 #12–13, P2 #11–12 |
| 7 | Radical **with** calculator | decimal, exactly hundredths | P1 #14–15, P2 #13–14 |
| 8 | Radical **without** calculator; squares of negatives | exact `a√b` or integer | P1 #16–20, P2 #15–18 |

Types 7 and 8 are explicitly opposed in the source — "use the square root
button on your calculator" versus "**NO DECIMAL ANSWERS** — do not use the
square root button." The app labels and enforces this per item. Accepting
`15.81` for `√250` in a type 8 item would teach the wrong habit.

Types 1–3 are **rendered from parameters, never transcribed.** The app draws
the coordinate plane and the intercept graphs from chosen intercept values, so
the picture and the answer key cannot disagree. This also sidesteps reading
line positions off a low-resolution scan.

## The step scaffold

Each multi-step problem carries an authored step chain as data. A step is a
sentence plus a template containing numeric blanks:

```js
{
  id: 'p1-7',
  type: 'equation',
  prompt: '2(n − 7) = −14',
  answer: { kind: 'int', value: 0 },
  steps: [
    { say: 'Distribute the 2:',       template: '{a}n − {b} = −14', blanks: { a: 2, b: 14 } },
    { say: 'Add 14 to both sides:',   template: '2n = {c}',         blanks: { c: 0 } },
    { say: 'Divide both sides by 2:', template: 'n = {d}',          blanks: { d: 0 } }
  ]
}
```

Each blank is its own input, compared numerically. There is no expression
parser and no algebraic-equivalence checking. That alternative was rejected:
its false negatives tell a student he is wrong when he is right, which is worse
than the rigidity it would remove.

Type 6 chains must expose the cancellation as its own step with its own
blanks — *"Cancel 18 and 20 by their common factor 2:  `{a}/{b} · 15/{c}`"* —
rather than jumping from the original product to the reduced answer. The
bad-cross-cancel detector below has nothing to inspect otherwise.

**Guard test.** A test walks every problem's step chain, applies each step, and
asserts the chain terminates at the declared `answer`. A mistranscribed problem
fails the suite rather than reaching the student. This is the defense against
transcription error in the source material, and it runs over generated variants
too.

## Answer checking

`checker.js` compares by answer kind. Rules the source dictates:

- **Fractions must be fully reduced.** `108/90` for `6/5` returns *"Right value
  — now simplify it completely"* and **does not consume an attempt**. The value
  is correct; only the final simplification is missing.
- **Type 7 requires exactly hundredths.** `15.81` passes; `15.8` returns *"round
  to the hundredths place"*; `15.811` is rejected.
- **Type 8 rejects any decimal**, with a reminder that the answer must be exact.
- **Ordered pairs** accept `(-4,0)`, `(-4, 0)`, and `-4,0` alike.
- **Radicals** accept `5√10`, `5 sqrt 10`, and `5r10`; a bare `√250` is
  rejected as not simplified.

`−6²` and `(−6)²` render with true superscripts and parentheses. That
distinction *is* the item; ambiguous rendering would destroy the question.

## Hints

The student's completed guides, checked against the answer keys, show five
specific misconceptions. Generic
"incorrect" feedback is worthless against these, so `hints.js` detects the
actual wrong answer and names the error:

| Detector | Trigger | Hint |
| --- | --- | --- |
| Subtract-a-negative | Answer matches treating `− (−7)` as `− 7` | "You're subtracting a negative. `− (−7)` becomes `+ 7`." |
| Zero quotient | Quotient is 0 and the answer equals the coefficient | "`0 ÷ 2` is `0`, not `2`." |
| Negative term across | Subtracted `2x` when the term was `−2x` | "`−2x` is already negative — **add** `2x` to both sides to cancel it." |
| Bad cross-cancel | A cancellation-step blank matches dividing two numerators, or two denominators, by a shared factor | "You can only cancel a top against a bottom." |
| Swapped intercepts | The two ordered pairs are each other's coordinates reversed | "Check which axis each one crosses. The x-intercept has y = 0." |

On a first miss the hint appears and the same blank is retried. On a second
miss the step is revealed with its reasoning and the problem continues. A
revealed step scores zero but does not end the problem — the remaining steps
are still worth practicing.

Any wrong answer not matching a detector falls back to a generic prompt to
check the step. Detectors are additive; more can be added as play reveals them.

## Modes

**Topic drill.** Choose one of the eight types and work problems until a
mastery bar fills, defined as four consecutive problems in which every blank
was right on its first attempt — one hint taken breaks the streak. For types
4-8 the guide problems come first, then generated variants, so repeated
drilling cannot degrade into memorizing that #7 is `n = 0`. Types 1-3 have no
authored problems and draw from their generators only.

**Mock test.** One mixed pass, scored, proportioned like the study guides —
roughly 2 coordinate plane, 2 intercepts, 6 equations, 2 evaluate, 2 fractions,
2 calculator radicals, 4 exact radicals and exponents. (Proportions come from
the guides. The actual Test #1 has not been seen.) The result screen lists what
to review, with worked solutions, plus trouble spots accumulated across all
past sessions.

## Modules

Logic is DOM-free and therefore testable without a browser, following the
pattern of the existing states-quiz project, a sibling repository on the
same machine.

| File | Responsibility |
| --- | --- |
| `src/problems.js` | The 35 transcribed guide problems with step chains |
| `src/generators.js` | One generator per type 1–8, same output shape, seeded |
| `src/checker.js` | Answer comparison per kind; normalization; reduced-fraction rule |
| `src/hints.js` | Wrong answer → targeted hint; the four misconception detectors |
| `src/session.js` | Drill and mock-test sequencing, attempts, mastery, scoring |
| `src/storage.js` | localStorage: per-topic mastery and cross-session trouble spots |
| `src/views.js` | All DOM: step blanks, coordinate-plane SVG, intercept-graph SVG |
| `src/app.html`, `src/app.css` | Page shell and styles |

`problems.js`, `generators.js`, `checker.js`, `hints.js`, `session.js`, and
`storage.js` touch no DOM. `views.js` is the only module that does.

Generators are seeded from a session seed so a session can be replayed exactly
when diagnosing a report of a bad problem.

## Testing

There is no Node on the target machine. Tests run under `jsc`, which ships with
macOS at
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`.
`./tests/run.sh` runs every `tests/*.test.js`, matching the existing project.

Coverage:

- The step-chain guard walk, over every authored problem and a fixed sample of
  generated variants per type.
- Every `checker.js` rule, including the reduced-fraction case that must not
  consume an attempt, the hundredths boundary, and type 8's decimal rejection.
- Each of the four hint detectors fires on its trigger and does not fire on
  unrelated wrong answers.
- Storage schema, including corrupt and absent localStorage.
- Generators produce only problems whose intercepts land on integer lattice
  points and whose equations have integer or simple-fraction solutions.

## Build

`python3 tools/build.py <dir>` inlines a directory's `src/` into its
`index.html`. Both the landing page and the app use it. **`index.html` is
generated — edit sources, not it.**

## Source material inventory

Types 1–3 are generated, not transcribed. Types 4–8 give 35 authored problems:
17 from Part 1 (#4–20) and 18 from Part 2 (#2–18, counting #10a and #10b
separately).

**All 35 are verified against the teacher's answer keys** (`Geo SG1 Part I Key`
and `Part II Key`, both gitignored). The keys are clean, right-side-up scans
and are the authority for `problems.js`. No problem statement remains
uncertain.

Part 2 #4 was the one item too faint to read in the student's copy. The key
resolves it as `1 + b/4 = −1` → `b = −8`. An earlier reconstruction inferred
`−1 + b/4 = −3` from the student's corrected answer; that reached the right
answer through the wrong equation, which is exactly why the key was needed.

Errors found in the completed guides, which motivate the detectors:

| Item | Problem | Correct | Student wrote |
| --- | --- | --- | --- |
| P1 #3b | intercepts of a graphed line | `(−5, 0)` and `(0, −2)` | `(−2, 0)` and `(0, −5)` — coordinates swapped |
| P1 #7 | `2(n − 7) = −14` | `n = 0` | `n = 2`, after correctly reaching `2n = 0` |
| P1 #10 | `p − r + p`, `p = −8`, `r = −7` | `−9` | `−23` |
| P1 #11 | `y + xy − x`, `x = −3`, `y = 2` | `−1` | `−7` |
| P2 #9 | `x + 7 = −2x + 7` | `x = 0` | `x = −2` first, self-corrected |
| P1 #12, P2 #12 | fraction products | `27/20`, `4/21` | wrong first pass, self-corrected |

The P1 #3b swap was invisible until the key arrived — the line position could
not be read reliably off the student's scan. It is the fifth detector below.

Radicals are not a weak area: `√56 = 2√14` and `√84 = 2√21` are both correct in
his work.

**Teacher vocabulary.** The Part II key writes *"Hint: keep, change, flip!"*
beside the fraction-division problem. The app uses that same phrase, so the
hint he reads at home matches the language used in class.

## Out of scope

- Any 8th grade topic. The landing page reserves the section; no tool is built.
- Accounts, sync, or any server. Progress is per-browser via localStorage.
- Topics beyond Test #1 algebra review.
