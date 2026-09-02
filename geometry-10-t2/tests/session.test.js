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

// sg2-3: blanks in order are KM, then 4, 9, then (+9,+9,20), then (÷4,÷4,5).
function drillSeg() {
  return createDrill('segment-addition',
                     { problems: only('sg2-3'), rng: makeRng(1) });
}

// --- correct answers walk the chain and finish the problem
var d = drillSeg();
check('starts at step 0', d.current().stepIndex, 0);
check('names the whole segment', d.submit('KM').status, 'correct');
check('accepts the reversed segment name too', drillSeg().submit('MK').status, 'correct');
check('advanced to step 1', d.current().stepIndex, 1);
check('coefficient', d.submit('4').status, 'correct');
check('constant', d.submit('9').status, 'correct');
check('advanced to step 2', d.current().stepIndex, 2);
check('left op', d.submit('+9').status, 'correct');
check('right op', d.submit('+9').status, 'correct');
check('step 2 result', d.submit('20').status, 'correct');
check('advanced to step 3', d.current().stepIndex, 3);
check('divide op accepts slash', d.submit('/4').status, 'correct');
check('divide op accepts unicode', d.submit('÷4').status, 'correct');
check('final answer', d.submit('5').status, 'correct');

// --- a wrong answer retries the same blank, then reveals
var d2 = drillSeg();
check('first miss is wrong', d2.submit('KL').status, 'wrong');
check('first miss does not advance', d2.current().stepIndex, 0);
check('second miss reveals', d2.submit('LM').status, 'revealed');
check('reveal advances', d2.current().stepIndex, 1);

// --- a display-only step is skipped, never presented as a blank to fill.
// sg2-9a opens with one: the postulate written out with nothing to enter.
var d3 = createDrill('angle-addition', { problems: only('sg2-9a'), rng: makeRng(2) });
check('display-only step is skipped', d3.current().stepIndex, 1);
check('substitution blank', d3.submit('163').status, 'correct');
check('subtract left', d3.submit('-48').status, 'correct');
check('subtract right', d3.submit('-48').status, 'correct');
check('angle addition answer', d3.submit('115').status, 'correct');

// --- the midpoint accepts a half in either notation and rejects a rounded one
function drillMid() {
  return createDrill('midpoint', { problems: only('sg2-5'), rng: makeRng(3) });
}
var m = drillMid();
m.submit('-3'); m.submit('-4');
check('midpoint as a decimal', m.submit('(-1.5, -2)').status, 'correct');
var m2 = drillMid();
m2.submit('-3'); m2.submit('-4');
check('midpoint as a fraction', m2.submit('(-3/2, -2)').status, 'correct');
var m3 = drillMid();
m3.submit('-3'); m3.submit('-4');
check('midpoint rounded off is wrong', m3.submit('(-2, -2)').status, 'wrong');

// --- an unreduced or unreadable entry is not a real attempt
var m4 = drillMid();
m4.submit('-3'); m4.submit('-4');
check('unreadable costs no try', m4.submit('about -1.5').status, 'malformed');
check('still on the same blank', m4.current().stepIndex, 1);
check('and a real answer still lands', m4.submit('(-1.5,-2)').status, 'correct');

// --- mastery ends a drill after four clean problems in a row
var d5 = createDrill('bisector', { rng: makeRng(4) });
var guard = 0;
while (!d5.isDone() && guard < 200) {
  var cur = d5.current();
  if (!cur) break;
  d5.submit(String(cur.problem.steps[cur.stepIndex].blanks[cur.blankName]));
  guard += 1;
}
check('drill ends at mastery', d5.isDone(), true);
check('mastery took four clean problems', d5.score(), MASTERY_TARGET);

// --- a drill runs past its authored problems into generated ones without
// throwing. This is where a missing generator would crash a real session.
var crashed = '';
for (var t = 0; t < TYPES.length; t++) {
  try {
    var dr = createDrill(TYPES[t], { rng: makeRng(100 + t) });
    var g2 = 0;
    while (!dr.isDone() && g2 < 400) {
      var c2 = dr.current();
      if (!c2) break;
      // Miss every problem, so the authored queue drains immediately and
      // every subsequent problem has to come from the generator.
      dr.submit('!'); dr.submit('!');
      g2 += 1;
    }
  } catch (e) { crashed += TYPES[t] + ' '; }
}
check('every type survives running past its authored problems', crashed, '');

// --- the practice test is twenty questions and covers every type
var total = 0, kinds = {};
for (var i = 0; i < MOCK_MIX.length; i++) {
  total += MOCK_MIX[i].count;
  kinds[MOCK_MIX[i].type] = true;
}
check('mock test is twenty questions', total, 20);
check('mock covers every type', Object.keys(kinds).length, TYPES.length);

var mock = createMockTest({ rng: makeRng(5) });
check('mock starts on question 1', mock.progressText(), 'Question 1 of 20');
var g3 = 0;
while (!mock.isDone() && g3 < 2000) {
  var c3 = mock.current();
  if (!c3) break;
  mock.submit(String(c3.problem.steps[c3.stepIndex].blanks[c3.blankName]));
  g3 += 1;
}
check('mock test finishes', mock.isDone(), true);
check('a perfect run scores twenty', mock.score(), 20);
check('a perfect run misses nothing', mock.missed().length, 0);

done('session');
