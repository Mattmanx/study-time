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
