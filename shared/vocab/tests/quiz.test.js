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

done('quiz');
