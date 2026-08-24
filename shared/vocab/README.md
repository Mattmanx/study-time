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

All commands below run from the repository root.

1. `mkdir -p <subject>/src <subject>/tests`
2. Write `<subject>/src/words.json` — a pure JSON data file, no JavaScript.
   The schema is below.
3. Copy `<subject>/src/app.html` from `spanish-10/src/app.html`, changing only
   the `<title>`.
4. Copy `<subject>/src/manifest.txt` and `<subject>/src/styles.txt` from
   `spanish-10/src/` unchanged. Paths are relative to `src/`, so `../../`
   reaches the repository root. The manifest's data line is what binds the
   file to the global the engine reads:

   ```
   SUBJECT = words.json
   ```

   `tools/build.py` reads that JSON at build time and emits
   `globalThis.SUBJECT = {…};` at that position in the bundle. The page has to
   work offline from `file://`, where `fetch()` is blocked, so the data is
   inlined rather than loaded. Malformed JSON, a missing data file, and a
   left-hand name that is not a usable JavaScript identifier each fail the
   build by name — the name becomes a global, so a typo there would
   otherwise inline a syntax error into a page that still built cleanly.
5. Copy `<subject>/tests/run.sh` from `spanish-10/tests/run.sh`, and write
   `<subject>/tests/words.test.js`, modeled on `spanish-10/tests/words.test.js`
   — it needs the same four opening lines that file has: three `load()` calls
   (the test helpers, `validate.js`, `quiz.js`) and then the data, which the
   test reads for itself because there is no build step under `jsc`:

   ```js
   globalThis.SUBJECT = JSON.parse(read('src/words.json'));
   ```

   `read()` is a `jsc` builtin and the path is relative to the subject's root,
   because `run.sh` `cd`s there first. `quiz.js` is the load that is easy to
   leave out and only bites later, when a round-completion assertion reaches
   for `createRound`. At minimum, call `validateSubject(SUBJECT)` and assert it
   returns nothing, plus spot checks against the answer key.
6. `./<subject>/tests/run.sh`
7. `python3 tools/build.py <subject>`
8. Add a `<li>` to `src/app.html` under the right grade, then
   **`python3 tools/build.py .`** — the landing page is a separate build step
   and is the thing most often forgotten.
9. Add a row to the root `README.md` table.

## The word list schema

A subject's `words.json` is one JSON object, UTF-8, no comments. Everything the
engine knows about the subject comes from it.

```json
{
  "id": "spanish-8",
  "title": "Spanish — Unit 2 Quiz",
  "subtitle": "Classroom objects",
  "notes": [
    "Transcribed verbatim from the answer key; do not normalize punctuation."
  ],
  "sideA": { "name": "Spanish", "lang": "es" },
  "sideB": { "name": "English", "lang": "en" },
  "pairs": [
    { "a": "la mochila", "b": "the backpack" }
  ],
  "confusables": [
    { "members": ["la mochila", "la bolsa"],
      "note": "Why these two get mixed up, in one sentence." }
  ]
}
```

### Every field

| Field | Type | Required | What it does |
| --- | --- | --- | --- |
| `id` | string, non-empty | yes | Storage key is `study-time.<id>.progress`. Use the directory name. |
| `title` | string, non-empty | yes | Page heading. |
| `subtitle` | string | no | One line under the heading. Omit it and nothing renders. |
| `notes` | array of non-empty strings | no | **Ignored at runtime.** JSON has no comments, so this is where the warnings for whoever edits the file live — which oddities in the source are deliberate, and what must not be "corrected". |
| `sideA` | object | yes | The first direction. |
| `sideA.name` | string, non-empty | yes | Label on the mode buttons and prompts. |
| `sideA.lang` | string | no | BCP 47 tag set as the `lang` attribute on rendered side-A text. |
| `sideB` | object | yes | The other direction; same fields as `sideA`. |
| `pairs` | array of objects | yes | The word list. **At least 4 entries** — a question shows four options, so fewer makes one impossible. |
| `pairs[].a` | string | yes | The side-A text. |
| `pairs[].b` | string | yes | The side-B text. |
| `confusables` | array of objects | no | Clusters that get a distinction note after a second miss. Omit it entirely if there are none. |
| `confusables[].members` | array of strings | yes, if the cluster exists | **At least 2**, each an exact match for some `pairs[].a`. |
| `confusables[].note` | string, non-empty | yes, if the cluster exists | Shown after a second miss on any member. |

### Constraints a generator must satisfy

`shared/vocab/validate.js` enforces these, and each subject's test suite runs
it, so violating one fails the build rather than reaching a student. A program
generating a list from an export trips the first three most often.

- Every `pairs[].a` is **unique** across the list, and every `pairs[].b` is
  **unique** across the list. A duplicate on either side creates a question
  with two correct options, and the student is marked wrong for being right.
- Every `pairs[].a` and `pairs[].b` is non-empty and equal to its own
  `.trim()` — no leading or trailing whitespace. Exported cells usually have
  some.
- Every `confusables[].members` entry matches some `pairs[].a` **exactly**,
  character for character. Near matches are typos, not aliases.
- `pairs` has at least 4 entries; each cluster has at least 2 members and a
  non-empty note.
- Anything not listed in the table above is ignored, but don't rely on that —
  the validator may grow.

### Notes on the fields that are easy to get wrong

`sideA` and `sideB` name the two directions and set the `lang` attribute on
rendered text. They are not required to be languages: a science subject can use
`{ "name": "Term" }` and `{ "name": "Definition" }`, and the mode buttons read
**Term → Definition** and **Definition → Term**.

`confusables.members` are **side A strings**. Distractors are drawn at random
from the whole pool, near-synonyms included on purpose, so a wrong answer on a
clustered word is usually a real confusion rather than a blank — `wrong` is not
useful on its own. The note is shown after a second miss, so write it as the
sentence a tutor would say: name the distinction, don't restate the answer.

`notes` is prose for the next human to open the file, at the exact place they
would edit. Use it for the things a reviewer would otherwise "fix": punctuation
that looks inconsistent because the answer key is inconsistent, parentheticals
that look redundant but are the only thing separating two items, and any
correction you made to the source.

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
