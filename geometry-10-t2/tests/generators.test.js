load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');

// --- the rng is deterministic, or seeded replay is worthless
var a = makeRng(42), b = makeRng(42), c = makeRng(43);
var sameSeed = true, diffSeed = false;
for (var i = 0; i < 20; i++) {
  var x = a();
  if (x !== b()) sameSeed = false;
  if (x !== c()) diffSeed = true;
  if (x < 0 || x >= 1) sameSeed = false;
}
check('same seed same sequence', sameSeed, true);
check('different seed differs', diffSeed, true);

// --- EVERY authored type must have a generator. createDrill() falls through
// to generate() the first time a problem is missed, and generate() throws on
// a type it does not know: a missing entry is a crash mid-session, not a gap.
var authoredTypes = {};
for (var ap = 0; ap < PROBLEMS.length; ap++) authoredTypes[PROBLEMS[ap].type] = 1;
var uncovered = 0;
for (var at in authoredTypes) {
  if (TYPES.indexOf(at) === -1) { uncovered += 1; print('  no generator: ' + at); }
}
check('every authored type is generable', uncovered, 0);
check('TYPES covers exactly the authored types',
      TYPES.length, Object.keys(authoredTypes).length);

var threw = 0;
try { generate('no-such-type', makeRng(1)); } catch (e) { threw = 1; }
check('an unknown type throws rather than returning junk', threw, 1);

// --- every generated problem must survive the same guards the authored ones do
var badWalk = 0, badVerify = 0, badTemplate = 0, missingFigure = 0;
var unreadable = 0;
var trailingDisplay = 0, emptyStep = 0;
var NEEDS_FIGURE = { 'segment-addition': 1, 'angle-naming': 1,
                     'angle-classify': 1, 'congruence': 1, 'bisector': 1,
                     'angle-addition': 1 };

for (var t = 0; t < TYPES.length; t++) {
  var rng = makeRng(1000 + t);
  for (var n = 0; n < 120; n++) {
    var p = generate(TYPES[t], rng);
    if (!walkProblem(p).ok) {
      badWalk += 1; print('  walk failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    if (p.verify(verifyArg(p.answer)) !== true) {
      badVerify += 1; print('  verify failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    for (var s = 0; s < p.steps.length; s++) {
      var toks = (p.steps[s].template.match(/\{(\w+)\}/g) || []).length;
      // opL/opR render as their own row, not as template tokens.
      var bk = Object.keys(p.steps[s].blanks).filter(function (k) {
        return k !== 'opL' && k !== 'opR';
      }).length;
      if (toks !== bk) {
        badTemplate += 1;
        print('  template/blank mismatch: ' + TYPES[t] + ' -- ' + p.steps[s].template);
      }
    }
    // A session skips display-only steps; one at the END would leave a
    // problem with nothing to ask.
    var lastStep = p.steps[p.steps.length - 1];
    if (Object.keys(lastStep.blanks).length === 0) trailingDisplay += 1;
    if (p.steps.length === 0) emptyStep += 1;
    // Same round-trip as the authored problems: a generated blank that
    // cannot read back its own value is an unanswerable question.
    for (var rs = 0; rs < p.steps.length; rs++) {
      var rblanks = p.steps[rs].blanks;
      for (var rn in rblanks) {
        if (!rblanks.hasOwnProperty(rn)) continue;
        var val = String(rblanks[rn]);
        if (checkAnswer(val, blankSpec(val)).status !== 'correct') {
          unreadable += 1;
          print('  blank cannot read back its own value: ' + TYPES[t] +
                ' ' + rn + ' = ' + val);
        }
      }
    }
    if (NEEDS_FIGURE[TYPES[t]] && !p.figure) missingFigure += 1;
  }
}
check('generated chains reach their answer', badWalk, 0);
check('generated answers verify', badVerify, 0);
check('generated templates match blanks', badTemplate, 0);
check('no generated problem ends on a display-only step', trailingDisplay, 0);
check('no generated problem has zero steps', emptyStep, 0);
check('graphical types carry a figure', missingFigure, 0);
check('every generated blank grades its own value as correct', unreadable, 0);

// --- segment addition: both pieces are lengths, so both must be positive,
// and the pieces must actually add to the printed total.
var rngS = makeRng(7), badPieces = 0;
for (var k = 0; k < 200; k++) {
  var sp = generate('segment-addition', rngS);
  var f = sp.figure;
  var x = sp.answer.value;
  var left = evalLinear(f.left, x), right = evalLinear(f.right, x);
  if (left <= 0 || right <= 0) badPieces += 1;
  else if (left + right !== parseInt(f.total, 10)) badPieces += 1;
}
check('segment pieces are positive and sum to the total', badPieces, 0);

// Reads "3x + 5", "x − 2", "4x" straight off the figure -- deliberately a
// second implementation, so a figure that disagrees with the step chain fails.
function evalLinear(text, x) {
  var s = String(text).replace(/−/g, '-').replace(/\s+/g, '');
  var m = s.match(/^(-?\d*)x([+-]\d+)?$/);
  if (!m) return NaN;
  var a = m[1] === '' ? 1 : (m[1] === '-' ? -1 : parseInt(m[1], 10));
  var b = m[2] ? parseInt(m[2], 10) : 0;
  return a * x + b;
}

// --- distance: exact answers stay integers, inexact ones carry exactly three
// decimal places. Getting this wrong marks a correct answer "needs-thousandths".
var rngD = makeRng(11), badShape = 0, sawExact = 0, sawRounded = 0;
for (var d = 0; d < 300; d++) {
  var dp = generate('distance', rngD);
  var kind = dp.answer.kind;
  if (kind === 'int') sawExact += 1;
  else if (kind === 'decimal3') sawRounded += 1;
  else badShape += 1;
  var finalBlank = String(dp.steps[dp.steps.length - 1].blanks.f);
  if (kind === 'decimal3' && !/^\d+\.\d{3}$/.test(finalBlank)) badShape += 1;
  if (kind === 'int' && !/^\d+$/.test(finalBlank)) badShape += 1;
}
check('distance answers are int or decimal3', badShape, 0);
check('distance produces exact answers', sawExact > 0, true);
check('distance produces rounded answers', sawRounded > 0, true);

// --- midpoint: halves must survive as halves. Rounding one to an integer is
// exactly the mistake the question exists to catch, so the generator must
// actually produce them.
var rngM = makeRng(13), sawHalf = 0, badMid = 0;
for (var m2 = 0; m2 < 200; m2++) {
  var mp = generate('midpoint', rngM);
  if (mp.answer.kind !== 'pair') { badMid += 1; continue; }
  if (mp.answer.x.den === 2 || mp.answer.y.den === 2) sawHalf += 1;
  // The midpoint must be the average of the two sums shown in step 1.
  var sums = mp.steps[0].blanks;
  if (sums.a * mp.answer.x.den !== 2 * mp.answer.x.num) badMid += 1;
  if (sums.b * mp.answer.y.den !== 2 * mp.answer.y.num) badMid += 1;
}
check('midpoints are pairs averaging the two sums', badMid, 0);
check('midpoints land on halves sometimes', sawHalf > 0, true);

// --- classify: nothing may land near a boundary, or "drawn to scale" is
// an unfair instruction. Every measure must also match its own figure.
var rngC = makeRng(17), ambiguous = 0, cDrift = 0;
for (var q = 0; q < 300; q++) {
  var cp = generate('angle-classify', rngC);
  var span = Math.abs(cp.figure.rays[1].deg - cp.figure.rays[0].deg);
  if (span > 180) span = 360 - span;
  if (classifyAngle(span) !== cp.answer.value) cDrift += 1;
  var off90 = Math.abs(span - 90), off180 = Math.abs(span - 180);
  if (span !== 90 && off90 < 10) ambiguous += 1;
  if (span !== 180 && off180 < 10) ambiguous += 1;
  if (span < 15) ambiguous += 1;
}
check('classify answers match their figures', cDrift, 0);
check('no classify angle sits on a boundary', ambiguous, 0);

// --- congruence: the two triangles must never share a letter, or a
// congruency statement becomes ambiguous.
var rngG = makeRng(19), shared = 0, wrongCount = 0;
for (var g = 0; g < 200; g++) {
  var gp = generate('congruence', rngG);
  for (var li = 0; li < 3; li++) {
    if (gp.figure.right.indexOf(gp.figure.left[li]) !== -1) shared += 1;
  }
  if (gp.steps.length !== 6) wrongCount += 1;
}
check('congruent triangles use distinct letters', shared, 0);
check('congruence always asks six statements', wrongCount, 0);

// --- angle addition: every printed measure must be a positive angle, and
// the two pieces must add to the whole.
var rngA = makeRng(23), badAngle = 0;
for (var aa = 0; aa < 300; aa++) {
  var apx = generate('angle-addition', rngA);
  if (/−\d|-\d+°/.test(apx.prompt.replace(/\(-?\d+, ?-?\d+\)/g, ''))) {
    // A negative degree measure would have leaked into the prompt.
    if (/=\s*−/.test(apx.prompt)) badAngle += 1;
  }
  if (apx.answer.value <= 0) badAngle += 1;
}
check('angle addition never prints a negative measure', badAngle, 0);

// --- bisector: all THREE directions must appear, and each must declare which
// one it is. Part I asks for the whole and for the equal other half; Part II
// #11a asks for a half of a given whole. If the generator only ever produced
// the doubling one, the drill would train the exact reflex #11a punishes.
var rngB = makeRng(29), seenAsk = {}, badAsk = 0;
var VALID_ASK = { 'whole': 1, 'half': 1, 'other-half': 1 };
for (var bb = 0; bb < 300; bb++) {
  var bp = generate('bisector', rngB);
  if (!VALID_ASK[bp.ask]) { badAsk += 1; continue; }
  seenAsk[bp.ask] = 1;
  // The stated answer must match the direction: a half for 'half' and
  // 'other-half', twice a half for 'whole'.
  var stated = bp.answer.value;
  var whole = /= (\d+)°\. Find m∠1/.exec(bp.prompt);
  if (bp.ask === 'half' && whole && parseInt(whole[1], 10) !== stated * 2) badAsk += 1;
}
check('every generated bisector declares its direction', badAsk, 0);
check('all three bisector directions generate', Object.keys(seenAsk).length, 3);

// --- distinct problems must get distinct ids, or the end-of-session review
// list silently collapses several missed problems into one row. Types whose
// prompt is a constant string ('Classify this angle.') are the risk here.
var idFail = 0;
for (var ti = 0; ti < TYPES.length; ti++) {
  var rngI = makeRng(31 + ti), byKey = {}, byId = {};
  for (var z = 0; z < 200; z++) {
    var ip = generate(TYPES[ti], rngI);
    byKey[ip.prompt + '|' + JSON.stringify(ip.figure || null) +
          '|' + JSON.stringify(ip.answer)] = 1;
    byId[ip.id] = 1;
  }
  if (Object.keys(byId).length !== Object.keys(byKey).length) {
    idFail += 1;
    print('  id collision in ' + TYPES[ti] + ': ' + Object.keys(byId).length +
          ' ids for ' + Object.keys(byKey).length + ' distinct problems');
  }
}
check('one id per distinct problem, every type', idFail, 0);

done('generators');
