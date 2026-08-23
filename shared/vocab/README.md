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
2. Write `<subject>/src/words.js` defining `globalThis.SUBJECT` (shape below).
3. Copy `<subject>/src/app.html` from `spanish-10/src/app.html`, changing only
   the `<title>`.
4. Copy `<subject>/src/manifest.txt` and `<subject>/src/styles.txt` from
   `spanish-10/src/` unchanged. Paths are relative to `src/`, so `../../`
   reaches the repository root.
5. Copy `<subject>/tests/run.sh` from `spanish-10/tests/run.sh`, and write
   `<subject>/tests/words.test.js`, modeled on `spanish-10/tests/words.test.js`
   — it needs the same three `load()` lines (helpers, `validate.js`, then this
   subject's `src/words.js`) before anything can run. At minimum, call
   `validateSubject(SUBJECT)` and assert it returns nothing, plus spot checks
   against the answer key.
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
