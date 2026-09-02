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
| `geometry-10-t2/` | 10th | Test #2 sections 1-1 to 1-4, the problem half of study guides Part I **and** Part II: Segment and Angle Addition Postulates, distance, midpoint, naming and classifying angles, congruency statements, angle bisectors |
| `geometry-10-t2-vocab/` | 10th | Test #2 sections 1-1 to 1-4, the vocabulary half: 15 terms, both directions (Parts I and II share one word bank) |
| `spanish-10/` | 10th | Lección preliminar quiz: greetings and introductions, 29 words and phrases |

## Geometry — Test #1: Algebra Review

Two modes:

- **Drill one topic** — work problems of a single type until the mastery bar
  fills, which takes four in a row answered correctly on the first try. The
  study guide's own problems come first, then generated variants, so drilling
  can't decay into memorizing the guide.
- **Practice test** — twenty mixed questions proportioned like the study
  guides, scored, ending with what to review.

Multi-step problems reveal one step at a time — instructions for a step you
haven't reached yet aren't shown at all, so the chain doesn't hand over the
method before you've thought about it. A step that just rewrites the equation
(like distributing) is a single blank. A step that moves something to both
sides is worked the way the answer key writes it on paper: the operation goes
in a blank under the left side, the same operation in a blank under the
right, and then a blank for the resulting equation — three blanks, not one.

Answer boxes show a greyed placeholder of the expected shape, like `(3, 0)`
or `5√10` or `3/4`, and typing something unreadable names the shape that was
wanted instead of just saying "wrong." A wrong-but-readable entry gets one
targeted hint and a retry; a second miss reveals that step and moves on.
Submit with Enter or the Check button — the button exists because there's no
comfortable Enter key on a tablet.

Operation notation is forgiving: `/` works for ÷, and `*` or `x` both work
for ×.

Two more rules worth knowing:

- **An unreduced fraction doesn't cost a try.** Enter `108/90` where `6/5` is
  wanted and it says *"Right value — now simplify it completely"* and lets you
  keep going. The value is right; only the simplification is missing.
- **Calculator and no-calculator radicals are enforced separately.** `√250` as
  a "with calculator" question wants `15.81`, rounded to exactly hundredths.
  The same `√250` as a "no calculator" question wants `5√10` and rejects any
  decimal, because the study guide is explicit about it.

## Geometry — Test #2: Sections 1-1 to 1-4

The test has two halves and so does the tool. **Test #2: Problems** is the same
drill-and-practice-test engine as Test #1, with eight new topics; **Test #2:
Vocabulary** is 15 word-bank terms on the shared vocabulary engine. They are
separate pages with separate progress, linked to each other from the top of
each one.

There are **two study guides**, Part I and Part II, covering the same sections
with different numbers. Both are in the problems tool: 26 authored questions,
roughly two of each topic, and Part I's come first in a drill. Part II is where
the third bisector question lives — the one that gives the **whole** angle and
asks for a half, the opposite of Part I's — so drilling bisectors now cycles
all three directions instead of training one reflex.

The problem half keeps everything Test #1 established — one step at a time,
one targeted hint before a reveal, generated variants once the study guide's
own problems run out — and adds what these sections need:

- **A midpoint is not a length.** `(−1.5, −2)` is a legal answer, in decimals
  or as `(−3/2, −2)`, and rounding it to `(−2, −2)` is wrong. Handing in the
  two coordinate *sums* instead of their averages is the study guide's own
  mistake, and it gets named rather than just marked wrong.
- **A segment has no direction.** `DE ≅ LK` and `DE ≅ KL` are the same
  statement and both are accepted. An angle name is the opposite: `∠DEF` and
  `∠FED` name the same angle, but each blank says which endpoint to start
  from, so the order is graded.
- **The angle sign is optional.** `∠DEF`, `<DEF`, `angle DEF` and a bare
  `DEF` all read the same.
- **Distances round to thousandths only when they have to.** Part I's distance
  comes out exactly 15, and `15` and `15.000` are both accepted; Part II's is
  √72, and that one wants `8.485` — exactly three decimal places.

> **There is no teacher answer key for Test #2.** Test #1 had one; this test
> has only completed student worksheets. Every answer in `problems.js` was
> derived from the printed question, and each problem carries a `verify` that
> recomputes it independently.
>
> `reference/` holds **three scans**: Part I, Part I again after corrections,
> and Part II. The middle one adds no questions, and it confirms the three
> Part I answers that had to be derived without a key — question 5 asks for the
> **midpoint** (the first scan re-ran the distance formula), question 3 solves
> to **x = 5**, and vocabulary blanks 1a and 1f were **swapped**.
>
> **Part II boxes two contradictory answers on two of its questions**, and in
> both cases the tool uses the correct one. Its distance is **8.485** (the
> other boxed value, 11.66, dropped the minus sign on −8), and its midpoint is
> **(−5, −1)** (the other, (−3, 3), subtracted the coordinates instead of
> adding them). Both are recorded in `problems.js`.

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
word list and three lines of plumbing, not another implementation. The word
list is a plain JSON data file (`src/words.json`), hand-editable and
generatable by any script that knows the schema; the build inlines it into the
page. See
[`shared/vocab/README.md`](shared/vocab/README.md).

## How it's built

Source lives in each topic's `src/`. **`index.html` files are generated — edit
the sources, not them.**

    python3 tools/build.py .              # rebuild the landing page
    python3 tools/build.py geometry-10    # rebuild the geometry tool
    cd geometry-10 && ./tests/run.sh      # run the unit tests
    python3 tools/build.py geometry-10-t2 # rebuild the Test #2 problems tool
    ./geometry-10-t2/tests/run.sh         # run its unit tests
    python3 tools/build.py geometry-10-t2-vocab
    ./geometry-10-t2-vocab/tests/run.sh   # run the Test #2 word list checks
    python3 tools/build.py spanish-10     # rebuild the Spanish tool
    ./shared/vocab/tests/run.sh           # run the vocabulary engine tests
    ./spanish-10/tests/run.sh             # run the Spanish word list checks
    ./tools/tests/build.test.sh           # run the build script's own test

| File | Responsibility |
| --- | --- |
| `src/checker.js` | Compares an answer per kind; infers a grading rule per blank |
| `src/problems.js` | The 35 study guide problems with their step chains |
| `src/generators.js` | Seeded generators producing fresh problems of each type |
| `src/hints.js` | Detects specific misconceptions and names them |
| `src/session.js` | Drill and practice-test sequencing, attempts, scoring |
| `src/storage.js` | localStorage mastery and trouble spots |
| `src/views.js` | All DOM: step blanks, coordinate plane and graph SVG |

`geometry-10-t2/src/` mirrors that table, with `figures.js` in place of the
coordinate-plane drawing in `views.js` — it draws collinear segments, rays from
a vertex, and two congruent triangles whose tick marks carry the
correspondence. The two tools are **copies, not a shared engine**: `checker.js`,
`session.js` and `storage.js` diverge only a little, and the right seam for a
`shared/mathdrill/` extraction will be clearer with a third test to look at
than it is with two. Until then, a fix to one is worth checking against the
other.

Everything except `views.js` is DOM-free, which is what makes it testable
without a browser.

### Tests

There is no Node on the target machine, so tests run under `jsc`
(JavaScriptCore), which ships with macOS at
`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`.
`./tests/run.sh` runs every `tests/*.test.js` and prints a pass/fail count per
suite.

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
- **A step not yet reached isn't rendered at all, on purpose.** Showing the
  whole chain up front — even blanked out — tells the student where they're
  going before they've thought about the next move.
- **Test #2 has no answer key, and `reference/` holds three scans covering two
  study guides.** Part I appears twice (the second time after corrections);
  Part II is the genuinely new one. See the note above and the header comments in
  `geometry-10-t2/src/problems.js` and `geometry-10-t2-vocab/src/words.json`.
  Re-derive before "correcting" anything there.
- **A bisector question must declare its `ask`** — `whole`, `half`, or
  `other-half`. The three directions have three different wrong answers, and
  without it the hint would tell a student to stop doubling on the one question
  where doubling is right. `problems.test.js` enforces that every bisector
  declares one.
- **Every type in `TYPES` needs a generator.** A drill falls through to a
  generated problem the first time one is missed, and `generate()` throws on a
  type it does not know — a missing entry is a crash mid-session, not a gap.
  `generators.test.js` checks this.
- **Vocabulary quizzes share one engine.** `shared/vocab/` holds the whole
  thing; a subject is a `src/words.json` data file plus three lines of
  plumbing, and the build inlines the JSON into the page. Read
  `shared/vocab/README.md` before starting one, and don't put a subject's
  vocabulary — or its language — into the shared files.
