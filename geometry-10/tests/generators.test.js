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

// --- every generated problem must survive the same guard the authored ones do
var badWalk = 0, badVerify = 0, badTemplate = 0, missingFigure = 0;
var NEEDS_FIGURE = { plane: 1, signs: 1, intercepts: 1 };

for (var t = 0; t < TYPES.length; t++) {
  var rng = makeRng(1000 + t);
  for (var n = 0; n < 40; n++) {
    var p = generate(TYPES[t], rng);
    if (!walkProblem(p).ok) {
      badWalk += 1; print('  walk failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    if (p.verify(verifyArg(p.answer)) !== true) {
      badVerify += 1; print('  verify failed: ' + TYPES[t] + ' -- ' + p.prompt);
    }
    for (var s = 0; s < p.steps.length; s++) {
      var toks = (p.steps[s].template.match(/\{(\w+)\}/g) || []).length;
      if (toks !== Object.keys(p.steps[s].blanks).length) badTemplate += 1;
    }
    if (NEEDS_FIGURE[TYPES[t]] && !p.figure) missingFigure += 1;
  }
}
check('generated chains reach their answer', badWalk, 0);
check('generated answers verify', badVerify, 0);
check('generated templates match blanks', badTemplate, 0);
check('graphical types carry a figure', missingFigure, 0);

// --- intercepts must land on integer lattice points inside the drawn grid
var rng2 = makeRng(7), offGrid = 0, degenerate = 0;
for (var k = 0; k < 60; k++) {
  var ip = generate('intercepts', rng2);
  var f = ip.figure;
  if (Math.abs(f.xInt) > 6 || Math.abs(f.yInt) > 6) offGrid += 1;
  // A zero intercept would put both intercepts at the origin, which makes
  // the question meaningless.
  if (f.xInt === 0 || f.yInt === 0) degenerate += 1;
}
check('intercepts stay on the grid', offGrid, 0);
check('no degenerate intercepts', degenerate, 0);

// --- equations must not generate fractional solutions
var rng3 = makeRng(11), nonInteger = 0;
for (var m = 0; m < 100; m++) {
  var eq = generate('equation', rng3);
  if (eq.answer.value !== Math.round(eq.answer.value)) nonInteger += 1;
}
check('equation answers are integers', nonInteger, 0);

// --- radical-exact must never generate an already-simplified radical,
// otherwise the question teaches nothing.
var rng4 = makeRng(13), trivial = 0;
for (var r = 0; r < 60; r++) {
  if (generate('radical-exact', rng4).answer.coef === 1) trivial += 1;
}
check('exact radicals always simplify', trivial, 0);

done('generators');
