load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');
load('src/hints.js');
load('src/storage.js');
load('src/session.js');

function only(id) {
  return PROBLEMS.filter(function (p) { return p.id === id; });
}

// p1-7: 2(n-7) = -14, blanks are 14, 0, 0 across three steps.
function drill7() {
  return createDrill('equation', { problems: only('p1-7'), rng: makeRng(1) });
}

// --- correct answers walk the chain and finish the problem
// p1-7 blanks in order: [14] then (+14,+14,0) then (÷2,÷2,0).
var d = drill7();
check('starts at step 0', d.current().stepIndex, 0);
check('step 0 correct', d.submit('14').status, 'correct');
check('advanced to step 1', d.current().stepIndex, 1);
check('left op correct', d.submit('+14').status, 'correct');
check('right op correct', d.submit('+14').status, 'correct');
check('step 1 result correct', d.submit('0').status, 'correct');
check('advanced to step 2', d.current().stepIndex, 2);
check('divide op accepts slash', d.submit('/2').status, 'correct');
check('divide op accepts unicode', d.submit('÷2').status, 'correct');
check('step 2 result correct', d.submit('0').status, 'correct');

// --- a wrong answer retries the same blank, then reveals
var d2 = drill7();
var r1 = d2.submit('12');
check('first miss is wrong', r1.status, 'wrong');
check('first miss does not advance', d2.current().stepIndex, 0);
var r2 = d2.submit('11');
check('second miss reveals', r2.status, 'revealed');
check('reveal advances', d2.current().stepIndex, 1);

// --- the zero-quotient hint reaches the student through the session
var d3 = drill7();
d3.submit('14'); d3.submit('+14'); d3.submit('+14'); d3.submit('0');
d3.submit('÷2'); d3.submit('÷2');
var r3 = d3.submit('2');
check('hint delivered', r3.hint.indexOf('is 0') !== -1, true);

// --- unreduced fractions cost nothing
var d4 = createDrill('fraction', { problems: only('p1-12'), rng: makeRng(2) });
d4.submit('9'); d4.submit('4');
var r4 = d4.submit('54/40');
check('unreduced status', r4.status, 'unreduced');
check('unreduced does not advance', r4.advanced, false);
var r5 = d4.submit('135/100');
check('still unreduced, not revealed', r5.status, 'unreduced');
check('accepts the reduced form', d4.submit('27/20').status, 'correct');

// --- malformed input costs nothing either
var d5 = drill7();
check('malformed status', d5.submit('').status, 'malformed');
check('malformed does not advance', d5.current().stepIndex, 0);
check('still on first attempt', d5.submit('12').status, 'wrong');

// --- a drill ends when the mastery target is reached
var d6 = createDrill('exponent', { rng: makeRng(3) });
var guard = 0;
while (!d6.isDone() && guard < 500) {
  var cur = d6.current();
  d6.submit(String(cur.problem.steps[cur.stepIndex].blanks[cur.blankName]));
  guard += 1;
}
check('drill terminates', d6.isDone(), true);
check('drill did not run away', guard < 500, true);

// --- the mock test covers every type and is the right length
var m = createMockTest({ rng: makeRng(4) });
var total = 0, kinds = {};
for (var i = 0; i < MOCK_MIX.length; i++) {
  total += MOCK_MIX[i].count;
  kinds[MOCK_MIX[i].type] = true;
}
check('mock length', total, 20);
check('mock covers every type', Object.keys(kinds).length, TYPES.length);
check('mock starts undone', m.isDone(), false);

// Answer the whole mock test correctly and confirm a clean sweep.
var g2 = 0;
while (!m.isDone() && g2 < 2000) {
  var c = m.current();
  m.submit(String(c.problem.steps[c.stepIndex].blanks[c.blankName]));
  g2 += 1;
}
check('mock terminates', m.isDone(), true);
check('perfect run has no misses', m.missed().length, 0);
check('perfect score', m.score(), 20);
check('one result per problem', m.results().length, 20);
check('all clean on a perfect run', m.results().filter(function (r) {
  return r.clean; }).length, 20);

done('session');
