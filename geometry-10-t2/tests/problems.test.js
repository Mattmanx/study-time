load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');

// --- structural rules every problem must satisfy
var seen = {};
var dupes = 0, badTemplate = 0, badWalk = 0, badVerify = 0;

for (var i = 0; i < PROBLEMS.length; i++) {
  var p = PROBLEMS[i];
  if (seen[p.id]) dupes += 1;
  seen[p.id] = true;

  // Every {token} in a template has a blank, and every blank is used.
  for (var s = 0; s < p.steps.length; s++) {
    var step = p.steps[s];
    var tokens = (step.template.match(/\{(\w+)\}/g) || [])
                   .map(function (t) { return t.slice(1, -1); });
    // opL/opR are rendered as their own row above the result, not as template
    // tokens, so they are excluded from this correspondence check.
    var keys = Object.keys(step.blanks).filter(function (k) {
      return k !== 'opL' && k !== 'opR';
    });
    if (tokens.length !== keys.length) { badTemplate += 1; continue; }
    for (var t = 0; t < tokens.length; t++) {
      if (!(tokens[t] in step.blanks)) badTemplate += 1;
    }
  }

  // The chain must terminate at the declared answer.
  var w = walkProblem(p);
  if (!w.ok) { badWalk += 1; print('  walk failed: ' + p.id + ' -- ' + w.error); }

  // The declared answer must actually solve the printed problem. There is no
  // teacher key for this test, so this check is the only thing standing
  // between a mistranscribed figure and a wrong answer reaching a student.
  if (p.verify(verifyArg(p.answer)) !== true) {
    badVerify += 1; print('  verify failed: ' + p.id);
  }
}

check('ids unique', dupes, 0);
check('templates match blanks', badTemplate, 0);
check('chains reach the answer', badWalk, 0);
check('answers solve the printed problem', badVerify, 0);

// --- EVERY blank must grade its own correct value as correct. walkProblem
// only checks the last blank of the last step, so a spec whose normalizer
// cannot read back the value it was built from hides everywhere else -- and a
// blank like that is unanswerable: 'malformed' costs no attempt, so the
// student never gets a hint, a reveal, or a way past it.
var unreadable = 0;
for (var rt = 0; rt < PROBLEMS.length; rt++) {
  var rp = PROBLEMS[rt];
  for (var rs = 0; rs < rp.steps.length; rs++) {
    var rblanks = rp.steps[rs].blanks;
    for (var rn in rblanks) {
      if (!rblanks.hasOwnProperty(rn)) continue;
      var val = String(rblanks[rn]);
      var res = checkAnswer(val, blankSpec(val));
      if (res.status !== 'correct') {
        unreadable += 1;
        print('  blank cannot read back its own value: ' + rp.id + ' step ' +
              rs + ' ' + rn + ' = ' + val + ' -> ' + res.status);
      }
    }
  }
}
check('every blank grades its own value as correct', unreadable, 0);

// --- walkProblem must actually be able to fail, or it proves nothing
var broken = {
  id: 'broken', type: 'bisector', source: 'test', prompt: 'x',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return n === 2; },
  steps: [{ say: 'Halve it:', template: 'x = {a}', blanks: { a: 99 } }]
};
check('walker catches a wrong final blank', walkProblem(broken).ok, false);

var noBlanks = {
  id: 'none', type: 'bisector', source: 'test', prompt: 'x',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return n === 2; },
  steps: [{ say: 'x', template: 'n', blanks: {} }]
};
check('walker rejects a final step with no blank', walkProblem(noBlanks).ok, false);

// --- a display-only step must not be the last one, or there is nothing to ask
var trailingDisplay = 0;
for (var d = 0; d < PROBLEMS.length; d++) {
  var last = PROBLEMS[d].steps[PROBLEMS[d].steps.length - 1];
  if (Object.keys(last.blanks).length === 0) trailingDisplay += 1;
}
check('no problem ends on a display-only step', trailingDisplay, 0);

// --- every type is represented, and every problem carries a real figure
// where the question is unanswerable without one
function ofType(t) {
  return PROBLEMS.filter(function (p) { return p.type === t; }).length;
}
check('total count', PROBLEMS.length, 26);
check('segment-addition count', ofType('segment-addition'), 2);
check('distance count', ofType('distance'), 2);
check('midpoint count', ofType('midpoint'), 2);
check('angle-naming count', ofType('angle-naming'), 2);
check('angle-classify count', ofType('angle-classify'), 8);
check('congruence count', ofType('congruence'), 2);
check('angle-addition count', ofType('angle-addition'), 4);
check('bisector count', ofType('bisector'), 4);

var NEEDS_FIGURE = { 'segment-addition': 1, 'angle-naming': 1,
                     'angle-classify': 1, 'congruence': 1 };
var missingFigure = 0;
for (var g = 0; g < PROBLEMS.length; g++) {
  if (NEEDS_FIGURE[PROBLEMS[g].type] && !PROBLEMS[g].figure) missingFigure += 1;
}
check('questions that need a picture have one', missingFigure, 0);

function byId(id) {
  var m = PROBLEMS.filter(function (p) { return p.id === id; });
  return m.length === 1 ? m[0] : null;
}

// --- the answers, derived independently. THERE IS NO TEACHER KEY for this
// test; the numbers below were recomputed from the printed questions.
check('sg2-3 segment addition x', byId('sg2-3').answer.value, 5);
check('sg2-4 distance is exact', byId('sg2-4').answer.value, 15);

// The worksheet answers #5 with the distance formula. It asks for the
// MIDPOINT: ((3 + -6)/2, (-8 + 4)/2) = (-1.5, -2).
var mid = byId('sg2-5');
check('sg2-5 is a pair, not a length', mid.answer.kind, 'pair');
check('sg2-5 midpoint x is -3/2', mid.answer.x.num + '/' + mid.answer.x.den, '-3/2');
check('sg2-5 midpoint y is -2', mid.answer.y.num + '/' + mid.answer.y.den, '-2/1');
check('sg2-5 rejects the distance answer',
      checkAnswer('15', mid.answer).status, 'malformed');

// #6: four namings of one angle, vertex E between D and F.
var nm = byId('sg2-6');
check('sg2-6 has four blanks', nm.steps.length, 4);
check('sg2-6 by vertex', nm.steps[0].blanks.a, '∠E');
check('sg2-6 by number', nm.steps[1].blanks.b, '∠5');
check('sg2-6 D first', nm.steps[2].blanks.c, '∠DEF');
check('sg2-6 F first', nm.steps[3].blanks.d, '∠FED');

// #7 a-d, in the order the worksheet draws them.
check('sg2-7a', byId('sg2-7a').answer.value, 'straight angle');
check('sg2-7b', byId('sg2-7b').answer.value, 'right angle');
check('sg2-7c', byId('sg2-7c').answer.value, 'acute angle');
check('sg2-7d', byId('sg2-7d').answer.value, 'obtuse angle');
// The classification must follow from the figure's own degrees, not from a
// label typed in beside it.
var drift = 0;
for (var c2 = 0; c2 < PROBLEMS.length; c2++) {
  var pc = PROBLEMS[c2];
  if (pc.type !== 'angle-classify') continue;
  var rays = pc.figure.rays;
  var span = Math.abs(rays[1].deg - rays[0].deg);
  if (span > 180) span = 360 - span;
  if (classifyAngle(span) !== pc.answer.value) {
    drift += 1; print('  figure/answer drift: ' + pc.id + ' draws ' + span);
  }
}
check('classify figures match their answers', drift, 0);

// #8: six congruency statements under the correspondence D-L, E-K, C-M.
var cg = byId('sg2-8');
check('sg2-8 has six statements', cg.steps.length, 6);
check('sg2-8 angle 1', cg.steps[0].blanks.a, '∠L');
check('sg2-8 angle 2', cg.steps[1].blanks.b, '∠K');
check('sg2-8 angle 3', cg.steps[2].blanks.c, '∠M');
check('sg2-8 side 1', cg.steps[3].blanks.d, 'LK');
check('sg2-8 side 2', cg.steps[4].blanks.e, 'LM');
check('sg2-8 side 3', cg.steps[5].blanks.f, 'KM');
// A segment has no direction, so the other order is equally right.
check('sg2-8 accepts KL for LK',
      checkAnswer('KL', blankSpec(cg.steps[3].blanks.d)).status, 'correct');

// #9: the Angle Addition Postulate, both flavours.
check('sg2-9a', byId('sg2-9a').answer.value, 115);
check('sg2-9b', byId('sg2-9b').answer.value, 6);

// The bisector pair. (a) doubles a half; (b) does NOT -- the halves are equal,
// and doubling here is the mistake the question is built to catch.
check('sg2-b8a doubles', byId('sg2-b8a').answer.value, 24);
check('sg2-b8b does not double', byId('sg2-b8b').answer.value, 45);

// --- Study Guide #2 PART II. Same topics, new numbers. Two of these
// questions are boxed TWICE on the worksheet with contradictory answers; the
// values below are the correct ones and the reason is in problems.js.
check('sg2b-3 segment addition x', byId('sg2b-3').answer.value, 1);

// #4 is the first authored distance that is NOT a perfect square: √72.
var d4b = byId('sg2b-4');
check('sg2b-4 needs thousandths', d4b.answer.kind, 'decimal3');
check('sg2b-4 distance', d4b.answer.value, 8.485);
check('sg2b-4 rejects two decimal places',
      checkAnswer('8.49', d4b.answer).status, 'needs-thousandths');
// The worksheet's other boxed answer, 11.66, dropped the minus sign on −8.
check('sg2b-4 rejects the sign-error answer',
      checkAnswer('11.660', d4b.answer).status, 'wrong');

// #5 is a lattice-point midpoint. The worksheet's other boxed answer, (−3, 3),
// subtracted the coordinates instead of adding them.
var m5b = byId('sg2b-5');
check('sg2b-5 midpoint x', m5b.answer.x.num + '/' + m5b.answer.x.den, '-5/1');
check('sg2b-5 midpoint y', m5b.answer.y.num + '/' + m5b.answer.y.den, '-1/1');
check('sg2b-5 rejects the subtraction answer',
      checkAnswer('(-3, 3)', m5b.answer).status, 'wrong');

var n6b = byId('sg2b-6');
check('sg2b-6 by vertex', n6b.steps[0].blanks.a, '∠G');
check('sg2b-6 by number', n6b.steps[1].blanks.b, '∠3');
check('sg2b-6 H first', n6b.steps[2].blanks.c, '∠HGF');
check('sg2b-6 F first', n6b.steps[3].blanks.d, '∠FGH');

// Part II prints the four classifications in a different order from Part I.
check('sg2b-7a', byId('sg2b-7a').answer.value, 'right angle');
check('sg2b-7b', byId('sg2b-7b').answer.value, 'obtuse angle');
check('sg2b-7c', byId('sg2b-7c').answer.value, 'acute angle');
check('sg2b-7d', byId('sg2b-7d').answer.value, 'straight angle');

// #8 correspondence Y-H, X-F, W-G, read off the tick marks.
var c8b = byId('sg2b-8');
check('sg2b-8 angle 1', c8b.steps[0].blanks.a, '∠H');
check('sg2b-8 angle 2', c8b.steps[1].blanks.b, '∠F');
check('sg2b-8 angle 3', c8b.steps[2].blanks.c, '∠G');
check('sg2b-8 side 1', c8b.steps[3].blanks.d, 'HF');
check('sg2b-8 side 2', c8b.steps[4].blanks.e, 'HG');
check('sg2b-8 side 3', c8b.steps[5].blanks.f, 'FG');

check('sg2b-9', byId('sg2b-9').answer.value, 88);
check('sg2b-10', byId('sg2b-10').answer.value, 9);

// The bisector direction Part I never asked: the WHOLE is given and a half is
// wanted, so this one divides where the Part I question multiplied.
check('sg2b-11a halves the whole', byId('sg2b-11a').answer.value, 39);
check('sg2b-11a asks for a half', byId('sg2b-11a').ask, 'half');
check('sg2b-11b is the equal-halves direction', byId('sg2b-11b').answer.value, 36);
check('sg2b-11b ask', byId('sg2b-11b').ask, 'other-half');

// Every bisector problem must declare which direction it asks, or the hint
// cannot tell "you doubled" from "you should have doubled".
var missingAsk = 0, VALID_ASK = { 'whole': 1, 'half': 1, 'other-half': 1 };
for (var ba = 0; ba < PROBLEMS.length; ba++) {
  if (PROBLEMS[ba].type !== 'bisector') continue;
  if (!VALID_ASK[PROBLEMS[ba].ask]) {
    missingAsk += 1; print('  bisector without a valid ask: ' + PROBLEMS[ba].id);
  }
}
check('every bisector declares its direction', missingAsk, 0);
// All three directions appear in the authored set.
var asks = {};
for (var bk = 0; bk < PROBLEMS.length; bk++) {
  if (PROBLEMS[bk].type === 'bisector') asks[PROBLEMS[bk].ask] = 1;
}
check('all three bisector directions are authored', Object.keys(asks).length, 3);

done('problems');
