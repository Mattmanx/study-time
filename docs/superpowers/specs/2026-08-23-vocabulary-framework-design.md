# Vocabulary study framework — design

*2026-08-23*

A reusable two-mode vocabulary quiz engine, plus its first subject: 10th grade
Spanish, Lección preliminar parts 1 and 2.

The engine is the deliverable that outlives this quiz. Future vocabulary — 8th
grade Spanish, English, science — should need a new word list and four small
files, never a new implementation.

## What the student does

Two modes, chosen on the menu screen. In a language subject they read as
**Spanish → English** and **English → Spanish**; in a science subject, **Term →
Definition** and **Definition → Term**. The engine never names them itself; the
subject supplies the labels.

A round walks every pair in the word list exactly once, in a shuffled order.
Each question shows one side of a pair and four options from the other side:
the correct answer plus three distractors drawn at random from that same side
of the whole pool. Option order is shuffled, so the answer is never in a
predictable slot.

Distractors are drawn from the entire pool, deliberately including near
synonyms. `Regular.` and `Más o menos.` appearing together is the exact
discrimination the quiz tests; excluding siblings would train the wrong skill.

### Two tries

- **First miss** — the chosen option turns red and stays visible. The question
  stays up and the student picks again from the three remaining options. No
  reveal.
- **Second miss** — the correct answer is revealed, along with the subject's
  distinction note if the pair belongs to a confusable cluster. Then the round
  moves on.
- **Correct on the second try** — accepted, but recorded as second-try, not
  clean.

Every pair therefore ends a round in one of three states: **clean**,
**second-try**, **missed**.

### End of round

The score is the count of clean answers out of the round size. Below it, a
"Review these" list of everything that was not clean, in two visually distinct
tiers: second-try items in a muted amber row, missed-both-tries items
highlighted red. Each row prints both sides of the pair, so the list is itself
study material.

A **Retry the ones you missed** button starts a retry round seeded with both
tiers — everything that was not clean.

### Retry rounds

Retry has different rules from a main round, on purpose.

- One attempt per showing. A miss turns red, reveals the correct answer, and
  moves on. There is no second try.
- A missed word returns to the back of the queue and comes around again on a
  later pass, with freshly drawn distractors and a reshuffled option order.
- A word answered correctly is cleared and never returns, however many passes
  it took.
- The round ends when the queue is empty — every word answered correctly once.
  A counter shows how many remain.

## Architecture

```
shared/vocab/
  quiz.js       round construction, question building, answer handling, retry queue
  storage.js    localStorage records, key derived from the subject id
  views.js      all DOM; renders every screen into one mount point
  vocab.css     the entire look
  validate.js   word list checks, run by each subject's own test suite
  tests/        engine tests, with their own run.sh
  README.md     the recipe for adding a subject, and the invariants

spanish-10/
  src/words.js     the only subject-specific content
  src/app.html     head, title, <main id="app">, template tokens
  src/manifest.txt shared JS by relative path, then words.js
  src/styles.txt   shared CSS by relative path
  index.html       generated — never edited
  reference/       gitignored teacher materials
```

Everything except `views.js` is DOM-free and testable under `jsc`, matching the
convention `geometry-10/` established.

`geometry-10/` is not touched. It is not vocabulary, and folding it into the
shared layer is churn.

### Subject configuration

A subject's `words.js` defines exactly one global:

```js
globalThis.SUBJECT = {
  id: 'spanish-10',
  title: 'Spanish — Lección preliminar Quiz',
  subtitle: 'Parts 1 and 2 — greetings and introductions',
  sideA: { name: 'Spanish', lang: 'es' },
  sideB: { name: 'English', lang: 'en' },
  pairs: [
    { a: '¿Cómo estás?', b: 'How are you? (familiar)' },
    // ...
  ],
  confusables: [
    { members: ['Regular.', 'Más o menos.'],
      note: 'Regular. is "okay"; Más o menos. is "so-so."' }
  ]
};
```

`sideA` and `sideB` drive the mode buttons, the `lang` attributes on rendered
text, and every label the student sees. No language name appears in shared
code. `confusables` members are side-A strings; the note is written by the
subject, rendered verbatim by the engine.

The storage key is `study-time.<id>.progress`, derived — never hardcoded.

### Engine API (`quiz.js`)

Pure functions and a plain-object round state. No DOM, no globals beyond the
exported names, no `Math.random` — every function that shuffles takes a seeded
RNG so tests can assert exact output.

- `makeRng(seed)` — deterministic generator
- `buildRound(subject, mode, rng)` — a shuffled full round
- `buildRetryRound(subject, mode, items, rng)` — a retry round from unclean items
- `currentQuestion(round)` — prompt, four options, remaining tries
- `answer(round, choice, rng)` — returns the outcome and the next state, and is
  the single place the two-try and retry-requeue rules live
- `roundSummary(round)` — score plus the clean / second-try / missed partition

### Storage (`storage.js`)

Same shape as `geometry-10/src/storage.js`: pure parse and update functions,
versioned, and any unexpected stored value yields a fresh record. Losing
history is a nuisance; refusing to start is a broken evening. Records best
clean score per mode, and a per-pair miss count so the end screen can point at
what keeps going wrong.

### Build

`tools/build.py` gains an optional `styles.txt` CSS manifest, mirroring the
existing `manifest.txt` for JS. When absent it defaults to `["app.css"]`, so
`geometry-10/` and the landing page build unchanged.

JS sharing needs no build change: manifest entries resolve relative to
`<project>/src/`, so `../../shared/vocab/quiz.js` reaches the shared directory.

## Testing

Under `jsc`, as the repo already requires. Two suites:

- `shared/vocab/tests/` — the engine. Runs `shared/vocab/tests/run.sh`.
- `spanish-10/tests/` — the word list, via the shared validator.

Two tests carry the framework's weight, in the spirit of geometry's "a mistyped
problem fails the build":

**Data validation.** Every subject's suite calls the shared validator on its own
word list: both sides non-empty and trimmed, no duplicate side-A string, no
duplicate side-B string, at least four pairs, and every `confusables` member
resolving to a real pair. A typo that would silently create an unanswerable
question fails the build instead of reaching a student.

**Retry-loop termination.** Seeded, and the place the new requirement can
actually break: a cleared word never reappears, a missed word does reappear on
a later pass, and the loop terminates. An off-by-one in the requeue produces an
endless round, which clicking through would not reveal.

Question construction is also asserted directly: exactly four options, the
correct answer always among them, no duplicate options, and distractors drawn
only from the answer's own side of the pool.

## Content rules for Spanish 10

29 pairs, transcribed verbatim from the study guide's answer key. The key is
the authority.

- **Punctuation and capitalization stay exactly as the key writes them.**
  `Hasta luego` has no period; `Adiós.` does. Normalizing would be editing the
  teacher's materials.
- **The English parentheticals are load-bearing.** `(familiar)`, `(formal)`,
  `(form.)` and `(familiar/formal)` are the only thing separating
  `¿Cómo estás?` from `¿Cómo está usted?`, `¿Y tú?` from `¿Y usted?`, and
  `¿Cómo te llamas?` from `¿Cómo se llama?`. Dropping them makes six items
  unanswerable.
- **One correction:** the guide prints `Encantado(a` with a truncated
  parenthesis. Written as `Encantado(a)`.

Confusable clusters, each with a note the engine shows after a second miss:

| Cluster | The distinction |
| --- | --- |
| `Bien.` / `Muy bien` | "well" vs "very well" |
| `Regular.` / `Más o menos.` | "okay" vs "so-so" |
| `¿Qué tal?` / `¿Qué pasa?` | "How's it going?" vs "What's happening?" |
| `Igualmente.` / `Mucho gusto` / `El gusto es mío.` / `Encantado(a)` | four replies to an introduction |
| `¿Cómo estás?` / `¿Cómo está usted?` | familiar vs formal |
| `¿Y tú?` / `¿Y usted?` | familiar vs formal |
| `¿Cómo te llamas?` / `¿Cómo se llama?` | your name vs his/her name |
| `Me llamo` / `Se llama...` | my name is vs his/her name is |

## Documentation

`shared/vocab/README.md` is the one that matters on the next subject: a
numbered recipe for adding one, the `SUBJECT` shape, which test suite to run,
and the standing invariants — transcribe from the answer key verbatim, never
commit `reference/`, keep student names out of the repository entirely, and
remember that the landing page is a separate `python3 tools/build.py .` step
that is easy to forget.

The root `README.md` gains a table row, a Spanish section describing the two
modes and the two-try rule, and a pointer to the shared README.

The landing page gains a Spanish entry under 10th Grade. The 8th Grade section
stays as it is — that is where the next subject lands.

## Out of scope

Deliberately not built, and worth saying out loud: typed recall, audio, spaced
repetition, and printable flashcards. Multiple choice trains recognition, which
is what this quiz format tests. Production practice is a separate conversation
and belongs in study advice rather than in this build.
