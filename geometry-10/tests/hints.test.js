load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/hints.js');

function ctx(problem, stepIndex, blankName, typed) {
  return { problem: problem, step: problem.steps[stepIndex],
           blankName: blankName, typed: typed };
}
function find(id) {
  return PROBLEMS.filter(function (p) { return p.id === id; })[0];
}
function has(s, needle) { return s.indexOf(needle) !== -1; }

// --- 1. subtracting a negative (P1 #10: wrote -23 for p - r + p, p=-8, r=-7)
var p10 = find('p1-10');
var h1 = hintFor(ctx(p10, 1, 'b', '-7'));
check('subtract-negative fires', has(h1, 'Subtracting a negative'), true);
check('subtract-negative silent when right', hintFor(ctx(p10, 1, 'b', '7')), '');

// --- 2. zero quotient (P1 #7: reached 2n = 0 then wrote n = 2)
var p7 = find('p1-7');
var h2 = hintFor(ctx(p7, 2, 'c', '2'));
check('zero-quotient fires', has(h2, 'is 0'), true);
check('zero-quotient silent when right', hintFor(ctx(p7, 2, 'c', '0')), '');
// It must not fire when the real answer simply is not zero.
check('zero-quotient silent elsewhere', hintFor(ctx(find('p1-4'), 1, 'b', '9')), '');

// --- 3. moving a negative variable term (P2 #9: subtracted 2x, got x = -2)
var p9 = find('p2-9');
var h3 = hintFor(ctx(p9, 0, 'a', '-1'));
check('negative-term fires', has(h3, 'add'), true);
check('negative-term silent when right', hintFor(ctx(p9, 0, 'a', '3')), '');
// It must also fire on a GENERATED equation, whose step reads
// '...together - add 2a to both sides' in lower case.
load('src/generators.js');
var genFired = false, genChecked = 0;
for (var gs = 1; gs <= 200 && !genFired; gs++) {
  var grng = makeRng(gs);
  for (var gn = 0; gn < 40; gn++) {
    var gp = generate('equation', grng);
    var gm = gp.steps[0].say.match(/add (\d+)([a-z]) to both sides/i);
    if (!gm) continue;
    genChecked += 1;
    var want = gp.steps[0].blanks[Object.keys(gp.steps[0].blanks)[0]];
    var wrong = want - 2 * parseInt(gm[1], 10);
    if (hintFor(ctx(gp, 0, Object.keys(gp.steps[0].blanks)[0], String(wrong)))) {
      genFired = true; break;
    }
  }
}
check('found generated move-term steps', genChecked > 0, true);
check('negative-term fires on generated too', genFired, true);

// --- 4. bad cross-cancel (P1 #12 and P2 #12, both wrong on the first pass)
var p12 = find('p1-12');
// Correct blank is 9 (18 cancelled with 10 by 2). Cancelling 18 against the
// OTHER numerator 15 by 3 would give 6.
var h4 = hintFor(ctx(p12, 0, 'a', '6'));
check('cross-cancel fires', has(h4, 'top against a bottom'), true);
check('cross-cancel silent when right', hintFor(ctx(p12, 0, 'a', '9')), '');

// --- 5. swapped intercepts (P1 #3b: gave (-2,0) and (0,-5) for (-5,0), (0,-2))
var swapProblem = {
  id: 'swap-test', type: 'intercepts', source: 'test',
  prompt: 'Name the x- and y-intercepts of the line.',
  answer: { kind: 'pair', x: 0, y: -2 },
  figure: { shape: 'line', xInt: -5, yInt: -2 },
  verify: function () { return true; },
  steps: [
    { say: 'x-intercept:', template: '{a}', blanks: { a: '(-5,0)' } },
    { say: 'y-intercept:', template: '{b}', blanks: { b: '(0,-2)' } }
  ]
};
var h5 = hintFor(ctx(swapProblem, 0, 'a', '(-2,0)'));
check('swap fires', has(h5, 'x-intercept has y = 0'), true);
check('swap silent when right', hintFor(ctx(swapProblem, 0, 'a', '(-5,0)')), '');
// A plain misread, not a swap, gets no hint from this detector.
check('swap silent on unrelated wrong', hintFor(ctx(swapProblem, 0, 'a', '(3,0)')), '');

// --- unmatched wrong answers stay silent so the caller can be generic
check('no false positive', hintFor(ctx(find('p1-18'), 0, 'a', '323')), '');

done('hints');
