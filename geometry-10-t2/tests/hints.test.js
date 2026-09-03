load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');
load('src/hints.js');

function byId(id) {
  return PROBLEMS.filter(function (p) { return p.id === id; })[0];
}
function hintOn(problem, stepIndex, blankName, typed) {
  return hintFor({ problem: problem, step: problem.steps[stepIndex],
                   blankName: blankName, typed: typed });
}
function fires(problem, stepIndex, blankName, typed) {
  return hintOn(problem, stepIndex, blankName, typed) !== '';
}

// --- adding where the postulate calls for subtracting.
// sg2-9a: 48 + x = 163, so x = 115. Adding gives 211.
var a9 = byId('sg2-9a');
check('add-instead-of-subtract fires', fires(a9, 2, 'b', '211'), true);
check('names the subtraction',
      /subtract it, do not add it/.test(hintOn(a9, 2, 'b', '211')), true);
check('a merely wrong number gets no hint', fires(a9, 2, 'b', '120'), false);
check('the right answer gets no hint', fires(a9, 2, 'b', '115'), false);

// --- squaring a negative and keeping the sign. (-9)^2 = 81, not -81.
var d4 = byId('sg2-4');
check('negative square fires', fires(d4, 1, 'c', '-81'), true);
check('names the sign rule',
      /never leaves a negative/.test(hintOn(d4, 1, 'c', '-81')), true);
check('other wrong squares get no hint', fires(d4, 1, 'c', '18'), false);

// --- stopping at the radicand. sqrt(225) = 15, and 225 is the tempting entry.
check('forgot-the-root fires', fires(d4, 3, 'f', '225'), true);
check('names the radicand',
      /under the radical/.test(hintOn(d4, 3, 'f', '225')), true);
check('a wrong root gets no hint', fires(d4, 3, 'f', '16'), false);

// --- the midpoint handed in without halving. This is the mistake on the
// worksheet itself: the sums (-3, -4) instead of the averages (-1.5, -2).
var m5 = byId('sg2-5');
check('midpoint-not-halved fires', fires(m5, 1, 'c', '(-3, -4)'), true);
check('midpoint-not-halved fires without parens', fires(m5, 1, 'c', '-3,-4'), true);
check('names the averaging',
      /divided by 2/.test(hintOn(m5, 1, 'c', '(-3, -4)')), true);
check('an unrelated wrong pair gets no hint', fires(m5, 1, 'c', '(0, 0)'), false);

// --- bisectors, all three directions. Each has a different wrong answer, and
// the hint has to tell them apart or it will tell a student to stop doubling
// on the one question where doubling is right.
// sg2-b8b asks for the OTHER half of a bisected angle: 45, not 90.
var b8b = byId('sg2-b8b');
check('doubling a half fires', fires(b8b, 0, 'a', '90'), true);
check('names the equal halves',
      /two EQUAL halves/.test(hintOn(b8b, 0, 'a', '90')), true);
// sg2-b8a asks for the WHOLE angle: 24, not 12.
var b8a = byId('sg2-b8a');
check('handing back one half fires', fires(b8a, 0, 'a', '12'), true);
check('names the whole angle',
      /whole angle/.test(hintOn(b8a, 0, 'a', '12')), true);
check('an unrelated bisector miss gets no hint', fires(b8a, 0, 'a', '30'), false);

// Part II #11a is the new direction: the whole (78) is given and a half (39)
// is wanted. Copying the whole across is the mistake.
var b11a = byId('sg2b-11a');
check('copying the whole across fires', fires(b11a, 0, 'a', '78'), true);
check('names the halving',
      /divides by 2/.test(hintOn(b11a, 0, 'a', '78')), true);
// The three directions must not share a message. Telling a student "nothing
// gets doubled here" on the question that DOES double would be worse than
// saying nothing at all.
check('the halving hint is not the equal-halves hint',
      hintOn(b11a, 0, 'a', '78') === hintOn(b8b, 0, 'a', '90'), false);
check('the halving hint is not the whole-angle hint',
      hintOn(b11a, 0, 'a', '78') === hintOn(b8a, 0, 'a', '12'), false);
// 12 is neither 78 nor half of it, so nothing fires.
check('an unrelated miss on the new direction is quiet',
      fires(b11a, 0, 'a', '50'), false);

// --- naming an angle with the vertex out of the middle.
var n6 = byId('sg2-6');
check('vertex-out-of-middle fires', fires(n6, 2, 'c', '∠EDF'), true);
check('names the middle rule',
      /vertex goes in the MIDDLE/.test(hintOn(n6, 2, 'c', '∠EDF')), true);
// Reversing D and F is a legal naming of the same angle, just not the one
// this blank asked for -- the vertex is still in the middle, so no hint.
check('a reversal gets no vertex hint', fires(n6, 2, 'c', '∠FED'), false);
check('entirely wrong letters get no hint', fires(n6, 2, 'c', '∠XYZ'), false);

// --- a congruency statement matched to the wrong vertex.
var c8 = byId('sg2-8');
check('wrong correspondence fires', fires(c8, 0, 'a', '∠K'), true);
check('names the marks',
      /tick marks and arcs/.test(hintOn(c8, 0, 'a', '∠K')), true);
check('wrong side correspondence fires', fires(c8, 3, 'd', 'LM'), true);
check('the right answer gets no hint', fires(c8, 0, 'a', '∠L'), false);
// A letter from the LEFT triangle is a different confusion; this detector
// stays quiet rather than giving a misleading explanation.
check('a left-triangle letter gets no hint', fires(c8, 0, 'a', '∠D'), false);

// --- a hint must never fire on a correct answer, for any blank of any
// problem, authored or generated. A hint on a right answer is worse than none.
var falsePositives = 0;
function sweep(p) {
  for (var s = 0; s < p.steps.length; s++) {
    var blanks = p.steps[s].blanks;
    for (var name in blanks) {
      if (!blanks.hasOwnProperty(name)) continue;
      if (hintOn(p, s, name, String(blanks[name])) !== '') {
        falsePositives += 1;
        print('  hint on a correct answer: ' + p.id + ' step ' + s + ' ' + name);
      }
    }
  }
}
for (var i = 0; i < PROBLEMS.length; i++) sweep(PROBLEMS[i]);
for (var t = 0; t < TYPES.length; t++) {
  var rng = makeRng(200 + t);
  for (var g = 0; g < 40; g++) sweep(generate(TYPES[t], rng));
}
check('no hint ever fires on a correct answer', falsePositives, 0);

// --- and a detector must not throw on junk input
var threw = 0;
try {
  for (var j = 0; j < PROBLEMS.length; j++) {
    var pj = PROBLEMS[j];
    for (var sj = 0; sj < pj.steps.length; sj++) {
      for (var nj in pj.steps[sj].blanks) {
        hintOn(pj, sj, nj, '');
        hintOn(pj, sj, nj, '???');
        hintOn(pj, sj, nj, '(((');
      }
    }
  }
} catch (e) { threw = 1; print('  threw: ' + e); }
check('detectors survive junk input', threw, 0);

done('hints');
