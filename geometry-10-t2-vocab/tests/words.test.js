load('../shared/vocab/tests/helpers.js');
load('../shared/vocab/validate.js');
load('../shared/vocab/quiz.js');
globalThis.SUBJECT = JSON.parse(read('src/words.json'));

// --- the word list survives the shared validator
check('word list is valid', validateSubject(SUBJECT).join(' | '), '');
check('the study guide has 15 pairs', SUBJECT.pairs.length, 15);

function definition(term) {
  for (var i = 0; i < SUBJECT.pairs.length; i++) {
    if (SUBJECT.pairs[i].a === term) return SUBJECT.pairs[i].b;
  }
  return '(not found)';
}

// --- spot checks against the derived definitions
check('Point', definition('Point'), 'A specific location in space');
check('Segment', definition('Segment'), 'A finite portion of a line');
check('Collinear', definition('Collinear'), 'Two or more points on the same line');
check('Vertex', definition('Vertex'),
      'The shared point where two rays or line segments meet, forming an angle');
check('Right Angle', definition('Right Angle'), 'An angle with an exact measure of 90°');
check('Straight Angle', definition('Straight Angle'), 'An angle that measures exactly 180°');
check('Angle Bisector', definition('Angle Bisector'),
      'A segment or ray that splits an angle in half');

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
check('five clusters declared', SUBJECT.confusables.length, 5);

// --- a full round in each direction is answerable end to end
var modes = [MODE_A_TO_B, MODE_B_TO_A];
for (var mi = 0; mi < modes.length; mi++) {
  var round = createRound(SUBJECT, modes[mi], { rng: makeRng(31 + mi) });
  var asked = 0;
  while (!round.isDone() && asked < 200) {
    round.answer(round.current().answer);
    asked += 1;
  }
  check('a full round covers 15 questions in ' + modes[mi], asked, 15);
  check('a clean round scores 15 in ' + modes[mi], round.summary().clean, 15);
}

done('words');
