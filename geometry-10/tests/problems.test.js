load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');

// --- structural rules every problem must satisfy
var seen = {};
var dupes = 0, badTemplate = 0, badWalk = 0, badVerify = 0, badFinal = 0;

for (var i = 0; i < PROBLEMS.length; i++) {
  var p = PROBLEMS[i];
  if (seen[p.id]) dupes += 1;
  seen[p.id] = true;

  // Every {token} in a template has a blank, and every blank is used.
  for (var s = 0; s < p.steps.length; s++) {
    var step = p.steps[s];
    var tokens = (step.template.match(/\{(\w+)\}/g) || [])
                   .map(function (t) { return t.slice(1, -1); });
    var keys = Object.keys(step.blanks);
    if (tokens.length !== keys.length) { badTemplate += 1; continue; }
    for (var t = 0; t < tokens.length; t++) {
      if (!(tokens[t] in step.blanks)) badTemplate += 1;
    }
  }

  // The chain must terminate at the declared answer.
  var w = walkProblem(p);
  if (!w.ok) { badWalk += 1; print('  walk failed: ' + p.id + ' -- ' + w.error); }

  // The declared answer must actually solve the printed problem.
  if (p.verify(verifyArg(p.answer)) !== true) {
    badVerify += 1; print('  verify failed: ' + p.id);
  }
}

check('ids unique', dupes, 0);
check('templates match blanks', badTemplate, 0);
check('chains reach the answer', badWalk, 0);
check('answers solve the printed problem', badVerify, 0);

// --- walkProblem must actually be able to fail, or it proves nothing
var broken = {
  id: 'broken', type: 'equation', source: 'test', prompt: '2n = 4',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return 2 * n === 4; },
  steps: [{ say: 'Divide by 2:', template: 'n = {a}', blanks: { a: 99 } }]
};
check('walker catches a wrong final blank', walkProblem(broken).ok, false);

var twoBlanks = {
  id: 'two', type: 'equation', source: 'test', prompt: '2n = 4',
  answer: { kind: 'int', value: 2 },
  verify: function (n) { return 2 * n === 4; },
  steps: [{ say: 'x', template: '{a} = {b}', blanks: { a: 2, b: 2 } }]
};
check('walker rejects a multi-blank final step', walkProblem(twoBlanks).ok, false);

// --- the 14 equations are all present and answer-key-verified
var eq = PROBLEMS.filter(function (p) { return p.type === 'equation'; });
check('equation count', eq.length, 14);

function byId(id) {
  var m = PROBLEMS.filter(function (p) { return p.id === id; });
  return m.length === 1 ? m[0] : null;
}
// Spot-check the answers the teacher's key gives, including the two the
// student got wrong: P1 #7 is zero, P2 #9 is zero.
check('p1-4', byId('p1-4').answer.value, 16);
check('p1-5', byId('p1-5').answer.value, -14);
check('p1-6', byId('p1-6').answer.value, 12);
check('p1-7 is zero', byId('p1-7').answer.value, 0);
check('p1-8', byId('p1-8').answer.value, 1);
check('p1-9', byId('p1-9').answer.value, -6);
check('p2-2', byId('p2-2').answer.value, -15);
check('p2-3', byId('p2-3').answer.value, -12);
check('p2-4', byId('p2-4').answer.value, -8);
check('p2-5', byId('p2-5').answer.value, 15);
check('p2-6', byId('p2-6').answer.value, 6);
check('p2-7', byId('p2-7').answer.value, -2);
check('p2-8', byId('p2-8').answer.value, -5);
check('p2-9 is zero', byId('p2-9').answer.value, 0);

// --- the remaining types, all answer-key-verified
check('total count', PROBLEMS.length, 35);
function ofType(t) {
  return PROBLEMS.filter(function (p) { return p.type === t; }).length;
}
check('evaluate count', ofType('evaluate'), 4);
check('fraction count', ofType('fraction'), 4);
check('radical-calc count', ofType('radical-calc'), 4);
check('radical-exact count', ofType('radical-exact'), 3);
check('exponent count', ofType('exponent'), 6);

// The two evaluate problems the student got wrong -- both subtracting a negative.
check('p1-10', byId('p1-10').answer.value, -9);
check('p1-11', byId('p1-11').answer.value, -1);
check('p2-10a', byId('p2-10a').answer.value, -16);
check('p2-10b', byId('p2-10b').answer.value, -78);

check('p1-12 num', byId('p1-12').answer.num, 27);
check('p1-12 den', byId('p1-12').answer.den, 20);
check('p1-13 num', byId('p1-13').answer.num, 6);
check('p1-13 den', byId('p1-13').answer.den, 5);
check('p2-11 num', byId('p2-11').answer.num, 3);
check('p2-12 num', byId('p2-12').answer.num, 4);
check('p2-12 den', byId('p2-12').answer.den, 21);

check('p1-14 decimal', byId('p1-14').answer.value, 15.81);
check('p1-16 coef', byId('p1-16').answer.coef, 5);
check('p1-16 rad', byId('p1-16').answer.rad, 10);
check('p1-17 coef', byId('p1-17').answer.coef, 2);
check('p2-15 rad', byId('p2-15').answer.rad, 21);

// -6^2 is negative but (-17)^2 is positive -- the distinction IS the item.
check('p1-20 is negative', byId('p1-20').answer.value, -36);
check('p1-19 is positive', byId('p1-19').answer.value, 289);
check('p2-17 is negative', byId('p2-17').answer.value, -225);
check('p2-18 is positive', byId('p2-18').answer.value, 576);

done('problems');
