// Fresh problems in the same shape as the authored ones, so drilling a topic
// cannot decay into memorising the study guide. No DOM access.
(function () {
  var TYPES = ['plane', 'signs', 'intercepts', 'equation', 'evaluate',
               'fraction', 'radical-calc', 'radical-exact', 'exponent'];

  // Mulberry32: small, fast, and deterministic across runs.
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // "Subtract −2a from both sides" is exactly the confusion this tool exists
  // to fix. Say the move the way a teacher would: a negative term is added.
  function undo(n, tail) {
    tail = tail || '';
    return n < 0 ? 'Add ' + (-n) + tail + ' to both sides:'
                 : 'Subtract ' + n + tail + ' from both sides:';
  }

  function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }
  function between(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function nonZero(rng, lo, hi) {
    var v = 0;
    while (v === 0) v = between(rng, lo, hi);
    return v;
  }
  // Worksheets write minus as U+2212, and the app should match.
  function sign(n) { return n < 0 ? '−' + Math.abs(n) : String(n); }
  function plus(n) { return n < 0 ? '− ' + Math.abs(n) : '+ ' + n; }

  function gcdOf(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  var QUADRANTS = [
    { name: 'I', x: '+', y: '+' }, { name: 'II', x: '-', y: '+' },
    { name: 'III', x: '-', y: '-' }, { name: 'IV', x: '+', y: '-' }
  ];

  function genPlane(rng) {
    var targets = ['x-axis', 'y-axis', 'origin', 'I', 'II', 'III', 'IV'];
    var target = pick(rng, targets);
    var isQuad = /^(I|II|III|IV)$/.test(target);
    return {
      id: 'gen-plane-' + target, type: 'plane', source: 'generated',
      prompt: isQuad ? 'Which quadrant is highlighted?' : 'What is the highlighted part called?',
      answer: { kind: 'label', value: isQuad ? 'quadrant ' + target : target },
      figure: { shape: 'plane', target: target },
      verify: function () { return true; },
      steps: [{ say: 'Name the highlighted part:', template: '{a}',
                blanks: { a: isQuad ? 'quadrant ' + target : target } }]
    };
  }

  function genSigns(rng) {
    var q = pick(rng, QUADRANTS);
    return {
      id: 'gen-signs-' + q.name, type: 'signs', source: 'generated',
      prompt: 'In quadrant ' + q.name + ', are x and y positive or negative?',
      answer: { kind: 'signs', x: q.x, y: q.y },
      figure: { shape: 'plane', target: q.name },
      verify: function () { return true; },
      steps: [{ say: 'Give the signs as (x, y):', template: '({a})',
                blanks: { a: q.x + ',' + q.y } }]
    };
  }

  // Both intercepts are asked as whole ordered pairs, which is also how the
  // student got P1 #3b wrong: he gave (−2,0) and (0,−5) for a line whose
  // intercepts are (−5,0) and (0,−2).
  function genIntercepts(rng) {
    var xi = nonZero(rng, -6, 6), yi = nonZero(rng, -6, 6);
    return {
      id: 'gen-int-' + xi + '-' + yi, type: 'intercepts', source: 'generated',
      prompt: 'Name the x- and y-intercepts of the line.',
      answer: { kind: 'pair', x: 0, y: yi },
      figure: { shape: 'line', xInt: xi, yInt: yi },
      verify: function (a) { return a.x === 0 && a.y === yi; },
      steps: [
        { say: 'The x-intercept is where the line crosses the x-axis, so y = 0:',
          template: '{a}', blanks: { a: '(' + xi + ',0)' } },
        { say: 'The y-intercept is where it crosses the y-axis, so x = 0:',
          template: '{b}', blanks: { b: '(0,' + yi + ')' } }
      ]
    };
  }

  // Four shapes, all with integer solutions: ax + b = c, a(x + b) = c,
  // ax + b = cx + d, and x/a + b = c.
  function genEquation(rng) {
    var v = pick(rng, ['n', 'x', 'p', 'b', 'm', 'a']);
    var ans = between(rng, -15, 15);
    var shape = between(rng, 1, 4);

    if (shape === 1) {
      var a = nonZero(rng, -9, 9), b = nonZero(rng, -20, 20);
      var c = a * ans + b;
      return {
        id: 'gen-eq1', type: 'equation', source: 'generated',
        prompt: sign(a) + v + ' ' + plus(b) + ' = ' + sign(c),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a * x + b === c; },
        steps: [
          { say: undo(b), template: sign(a) + v + ' = {p}', blanks: { p: c - b } },
          { say: 'Divide both sides by ' + a + ':', template: v + ' = {q}', blanks: { q: ans } }
        ]
      };
    }
    if (shape === 2) {
      var a2 = nonZero(rng, -8, 8), b2 = nonZero(rng, -12, 12);
      var c2 = a2 * (ans + b2);
      return {
        id: 'gen-eq2', type: 'equation', source: 'generated',
        prompt: sign(a2) + '(' + v + ' ' + plus(b2) + ') = ' + sign(c2),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a2 * (x + b2) === c2; },
        steps: [
          { say: 'Distribute the ' + a2 + ':', template: sign(a2) + v + ' ' + plus(a2 * b2) + ' = ' + sign(c2), blanks: {} },
          { say: undo(a2 * b2), template: sign(a2) + v + ' = {p}', blanks: { p: c2 - a2 * b2 } },
          { say: 'Divide both sides by ' + a2 + ':', template: v + ' = {q}', blanks: { q: ans } }
        ]
      };
    }
    if (shape === 3) {
      var a3 = nonZero(rng, -9, 9), c3 = nonZero(rng, -9, 9);
      while (a3 === c3) c3 = nonZero(rng, -9, 9);
      var b3 = nonZero(rng, -20, 20);
      var d3 = (a3 - c3) * ans + b3;
      return {
        id: 'gen-eq3', type: 'equation', source: 'generated',
        prompt: sign(a3) + v + ' ' + plus(b3) + ' = ' + sign(c3) + v + ' ' + plus(d3),
        answer: { kind: 'int', value: ans },
        verify: function (x) { return a3 * x + b3 === c3 * x + d3; },
        steps: [
          { say: 'Move the variable terms together — ' + undo(c3, v).charAt(0).toLowerCase() + undo(c3, v).slice(1),
            template: '{p}' + v + ' ' + plus(b3) + ' = ' + sign(d3), blanks: { p: a3 - c3 } },
          { say: undo(b3),
            template: sign(a3 - c3) + v + ' = {q}', blanks: { q: d3 - b3 } },
          { say: 'Divide both sides by ' + (a3 - c3) + ':', template: v + ' = {r}', blanks: { r: ans } }
        ]
      };
    }
    var d4 = between(rng, 2, 12), b4 = nonZero(rng, -12, 12);
    var c4 = ans / d4 + b4;
    // Keep the division exact by rebuilding the answer as a multiple of d4.
    var ans4 = between(rng, -8, 8) * d4;
    c4 = ans4 / d4 + b4;
    return {
      id: 'gen-eq4', type: 'equation', source: 'generated',
      prompt: v + '/' + d4 + ' ' + plus(b4) + ' = ' + sign(c4),
      answer: { kind: 'int', value: ans4 },
      verify: function (x) { return x / d4 + b4 === c4; },
      steps: [
        { say: undo(b4), template: v + '/' + d4 + ' = {p}', blanks: { p: c4 - b4 } },
        { say: 'Multiply both sides by ' + d4 + ':', template: v + ' = {q}', blanks: { q: ans4 } }
      ]
    };
  }

  // Always includes a subtraction of a negative -- the single move that
  // accounts for both evaluate errors on the guides.
  function genEvaluate(rng) {
    var a = nonZero(rng, -9, 9), b = nonZero(rng, -9, 9);
    var value = a - b + a;
    return {
      id: 'gen-eval', type: 'evaluate', source: 'generated',
      prompt: 'p − r + p    when p = ' + sign(a) + ' and r = ' + sign(b),
      answer: { kind: 'int', value: value },
      verify: function (v) { return a - b + a === v; },
      steps: [
        { say: 'Substitute the values:',
          template: '(' + sign(a) + ') − ({s}) + (' + sign(a) + ')', blanks: { s: b } },
        { say: b < 0 ? 'Subtracting a negative is adding. Rewrite it:' : 'Drop the parentheses:',
          template: sign(a) + ' ' + plus(-b) + ' ' + plus(a), blanks: {} },
        { say: 'Add left to right:', template: '{t}', blanks: { t: value } }
      ]
    };
  }

  // Generated fractions take the multiply-then-simplify route rather than
  // cancelling first, so the bad-cross-cancel detector applies to the
  // authored problems only. That is deliberate: inventing a legal
  // cancellation pair for arbitrary numerators and denominators is a
  // different problem from generating the arithmetic.
  function genFraction(rng) {
    var n1 = between(rng, 2, 12), d1 = between(rng, 2, 12);
    var n2 = between(rng, 2, 12), d2 = between(rng, 2, 12);
    var divide = rng() < 0.5;
    var num = divide ? n1 * d2 : n1 * n2;
    var den = divide ? d1 * n2 : d1 * d2;
    var g = gcdOf(num, den);
    var rn = num / g, rd = den / g;
    var shown = divide ? (n1 + '/' + d1 + ' ÷ ' + n2 + '/' + d2)
                       : (n1 + '/' + d1 + ' · ' + n2 + '/' + d2);
    var steps = [];
    if (divide) {
      steps.push({ say: 'Keep, change, flip — turn the divide into a multiply:',
                   template: n1 + '/' + d1 + ' · {f}/' + n2, blanks: { f: d2 } });
    }
    steps.push({ say: 'Multiply straight across:',
                 template: '{m}/' + den, blanks: { m: num } });
    steps.push({ say: 'Simplify completely:', template: '{r}', blanks: { r: rn + '/' + rd } });
    return {
      id: 'gen-frac', type: 'fraction', source: 'generated', prompt: shown,
      answer: { kind: 'fraction', num: rn, den: rd },
      verify: function (f) { return Math.abs(num / den - f.num / f.den) < 1e-9; },
      steps: steps
    };
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  function genRadicalCalc(rng) {
    var n = between(rng, 20, 200);
    while (Math.sqrt(n) === Math.round(Math.sqrt(n))) n = between(rng, 20, 200);
    var v = round2(Math.sqrt(n));
    return {
      id: 'gen-radc', type: 'radical-calc', source: 'generated', prompt: '√' + n,
      answer: { kind: 'decimal2', value: v },
      verify: function (x) { return Math.abs(Math.sqrt(n) - x) < 0.005; },
      steps: [{ say: 'Round √' + n + ' = ' + Math.sqrt(n).toFixed(4) +
                     '… to the hundredths place:',
                template: '{a}', blanks: { a: v.toFixed(2) } }]
    };
  }

  function genRadicalExact(rng) {
    var coef = between(rng, 2, 7);
    var radicands = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];
    var rad = pick(rng, radicands);
    var n = coef * coef * rad;
    return {
      id: 'gen-rade', type: 'radical-exact', source: 'generated', prompt: '√' + n,
      answer: { kind: 'radical', coef: coef, rad: rad },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(n)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides ' + n + ':',
          template: '√' + n + ' = √({a} · ' + rad + ')', blanks: { a: coef * coef } },
        { say: 'Take the square root of ' + (coef * coef) + ' out front:',
          template: '{b}√' + rad, blanks: { b: coef } },
        { say: 'Write the complete simplified answer:',
          template: '{c}', blanks: { c: coef + '√' + rad } }
      ]
    };
  }

  function genExponent(rng) {
    var base = between(rng, 3, 25);
    var form = between(rng, 1, 3);   // 1: n^2   2: (-n)^2   3: -n^2
    if (form === 1) {
      return {
        id: 'gen-exp1', type: 'exponent', source: 'generated', prompt: base + '²',
        answer: { kind: 'int', value: base * base },
        verify: function (v) { return base * base === v; },
        steps: [{ say: 'Write it as a product:',
                  template: base + ' · ' + base + ' = {a}', blanks: { a: base * base } }]
      };
    }
    if (form === 2) {
      return {
        id: 'gen-exp2', type: 'exponent', source: 'generated', prompt: '(−' + base + ')²',
        answer: { kind: 'int', value: base * base },
        verify: function (v) { return base * base === v; },
        steps: [{ say: 'The −' + base + ' is inside the parentheses, so both factors are negative:',
                  template: '(−' + base + ') · (−' + base + ') = {a}', blanks: { a: base * base } }]
      };
    }
    return {
      id: 'gen-exp3', type: 'exponent', source: 'generated', prompt: '−' + base + '²',
      answer: { kind: 'int', value: -(base * base) },
      verify: function (v) { return -(base * base) === v; },
      steps: [{ say: 'No parentheses, so only the ' + base + ' is squared:',
                template: '−(' + base + ' · ' + base + ') = {a}', blanks: { a: -(base * base) } }]
    };
  }

  var BY_TYPE = {
    'plane': genPlane, 'signs': genSigns, 'intercepts': genIntercepts,
    'equation': genEquation, 'evaluate': genEvaluate, 'fraction': genFraction,
    'radical-calc': genRadicalCalc, 'radical-exact': genRadicalExact,
    'exponent': genExponent
  };

  function generate(type, rng) {
    var fn = BY_TYPE[type];
    if (!fn) throw new Error('unknown problem type: ' + type);
    return fn(rng);
  }

  globalThis.TYPES = TYPES;
  globalThis.makeRng = makeRng;
  globalThis.generate = generate;
})();
