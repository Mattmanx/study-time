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
| `src/session.js` | Drill and practice-test sequencing, attempts, scoring |
| `src/storage.js` | localStorage mastery and trouble spots |
| `src/views.js` | All DOM: step blanks, coordinate plane and graph SVG |

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
