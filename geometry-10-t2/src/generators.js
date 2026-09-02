// Fresh problems in the same shape as the authored ones, so drilling a topic
// cannot decay into memorising the study guide. No DOM access.
//
// EVERY type in TYPES needs an entry in BY_TYPE. createDrill() calls
// generate() the moment the authored queue drains -- which is the first time
// a problem is missed -- and generate() throws on a type it does not know.
// A missing generator is not a gap, it is a crash mid-session.
(function () {
  var TYPES = ['segment-addition', 'distance', 'midpoint', 'angle-naming',
               'angle-classify', 'congruence', 'angle-addition', 'bisector'];

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

  // The mark written under each side on paper: +1, -5, ÷4.
  function opMark(n) { return n < 0 ? '+' + (-n) : '-' + n; }
  function divMark(n) { return '÷' + n; }
  function undo(n) {
    return n < 0 ? 'Add ' + (-n) + ' to both sides:'
                 : 'Subtract ' + n + ' from both sides:';
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

  // Distinct letters, so no figure ever labels two points the same.
  var ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
  function letters(rng, count, exclude) {
    var pool = ALPHABET.filter(function (c) {
      return !exclude || exclude.indexOf(c) === -1;
    });
    var out = [];
    for (var i = 0; i < count; i++) {
      var idx = Math.floor(rng() * pool.length);
      out.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return out;
  }

  // ---- Segment Addition Postulate: two pieces make the whole.
  function genSegmentAddition(rng) {
    var L = letters(rng, 3);
    var K = L[0], M = L[1], N = L[2];
    var x, a, c, b, d, kl, lm;
    // Both pieces are lengths, so both must come out positive.
    do {
      x = between(rng, 2, 12);
      a = between(rng, 1, 5); c = between(rng, 1, 5);
      b = between(rng, -12, 12); d = between(rng, -12, 12);
      kl = a * x + b; lm = c * x + d;
    } while (kl <= 0 || lm <= 0 || (b === 0 && d === 0));

    var total = kl + lm;
    var coef = a + c, cons = b + d;
    var steps = [
      { say: 'The two short pieces make the whole. Name the whole segment:',
        template: K + M + ' + ' + M + N + ' = {a}', blanks: { a: K + N } },
      { say: 'Substitute the expressions and combine like terms:',
        template: cons === 0 ? '{a}x = ' + total
                             : (cons < 0 ? '{a}x − {b} = ' + total
                                         : '{a}x + {b} = ' + total),
        blanks: cons === 0 ? { a: coef } : { a: coef, b: Math.abs(cons) } }
    ];
    if (cons !== 0) {
      steps.push({ say: undo(cons), template: sign(coef) + 'x = {c}',
                   blanks: { opL: opMark(cons), opR: opMark(cons),
                             c: total - cons } });
    }
    steps.push({ say: 'Divide both sides by ' + coef + ':', template: 'x = {d}',
                 blanks: { opL: divMark(coef), opR: divMark(coef), d: x } });

    return {
      id: 'gen-segadd-' + K + M + N + '-' + a + '_' + b + '_' + c + '_' + d,
      type: 'segment-addition', source: 'generated',
      prompt: 'Use the figure to write an equation with the Segment Addition Postulate, then solve for x.',
      figure: { shape: 'segment', names: [K, M, N], at: 0.45,
                left: expr(a, b), right: expr(c, d), total: String(total) },
      answer: { kind: 'int', value: x },
      verify: function (v) { return (a * v + b) + (c * v + d) === total; },
      steps: steps
    };
  }

  function expr(a, b) {
    var lead = a === 1 ? 'x' : a + 'x';
    if (b === 0) return lead;
    return lead + ' ' + plus(b);
  }

  // ---- Distance formula. Pythagorean triples most of the time, so the
  // answer comes out exact the way the study guide's own does; the rest land
  // irrational and exercise "round to the nearest thousandth if necessary".
  var TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15],
                 [8, 15, 17], [7, 24, 25], [12, 16, 20], [20, 21, 29]];

  function genDistance(rng) {
    var exact = rng() < 0.7;
    var dx, dy;
    if (exact) {
      var t = pick(rng, TRIPLES);
      dx = t[0] * (rng() < 0.5 ? -1 : 1);
      dy = t[1] * (rng() < 0.5 ? -1 : 1);
      if (rng() < 0.5) { var sw = dx; dx = dy; dy = sw; }
    } else {
      do {
        dx = nonZero(rng, -12, 12); dy = nonZero(rng, -12, 12);
      } while (isSquare(dx * dx + dy * dy));
    }
    var ax = between(rng, -9, 9), ay = between(rng, -9, 9);
    var bx = ax + dx, by = ay + dy;
    var sq = dx * dx + dy * dy;
    var d = Math.sqrt(sq);
    var shown = exact ? Math.round(d) : d.toFixed(3);

    return {
      id: 'gen-dist-' + ax + '_' + ay + '_' + bx + '_' + by,
      type: 'distance', source: 'generated',
      prompt: 'Find the DISTANCE of the line segment from A (' + sign(ax) +
              ', ' + sign(ay) + ') to B (' + sign(bx) + ', ' + sign(by) +
              '). Round to the nearest thousandth if necessary.',
      answer: blankSpec(String(shown)),
      verify: function (v) {
        return exact ? v * v === sq : Math.abs(v * v - sq) < 0.05;
      },
      steps: [
        { say: 'Subtract the x-coordinates, then the y-coordinates:',
          template: 'd = √( ({a})² + ({b})² )', blanks: { a: dx, b: dy } },
        { say: 'Square each one. A negative squared is positive:',
          template: 'd = √( {c} + {d} )', blanks: { c: dx * dx, d: dy * dy } },
        { say: 'Add what is under the radical:',
          template: 'd = √{e}', blanks: { e: sq } },
        { say: exact ? 'Take the square root. This one comes out exact:'
                     : 'Take the square root and round to three decimal places:',
          template: 'd = {f}', blanks: { f: shown } }
      ]
    };
  }

  function isSquare(n) {
    var r = Math.round(Math.sqrt(n));
    return r * r === n;
  }

  // ---- Midpoint. Coordinates of mixed parity land the midpoint on a half,
  // which is the case the student is most likely to round away.
  function genMidpoint(rng) {
    var ax = between(rng, -9, 9), ay = between(rng, -9, 9);
    var bx = between(rng, -9, 9), by = between(rng, -9, 9);
    if (ax === bx && ay === by) bx += 2;
    var sx = ax + bx, sy = ay + by;
    var text = '(' + half(sx) + ', ' + half(sy) + ')';

    return {
      id: 'gen-mid-' + ax + '_' + ay + '_' + bx + '_' + by,
      type: 'midpoint', source: 'generated',
      prompt: 'Find the MIDPOINT of the segment from A (' + sign(ax) + ', ' +
              sign(ay) + ') to B (' + sign(bx) + ', ' + sign(by) + ').',
      answer: blankSpec(text),
      verify: function (m) {
        return sx * m.x.den === 2 * m.x.num && sy * m.y.den === 2 * m.y.num;
      },
      steps: [
        { say: 'Add the x-coordinates, then add the y-coordinates:',
          template: 'M = ( {a}/2 , {b}/2 )', blanks: { a: sx, b: sy } },
        { say: 'Divide each sum by 2. Halves are fine — write it as a decimal:',
          template: 'M = {c}', blanks: { c: text } }
      ]
    };
  }

  // Integer or half, whichever the sum works out to: JS prints 3 and -1.5
  // exactly the way the answer should read.
  function half(sum) { return String(sum / 2); }

  // ---- Naming one angle four ways. The question fixes which endpoint leads,
  // so there is exactly one right answer per blank and no set comparison.
  function genAngleNaming(rng) {
    var L = letters(rng, 3);
    var P = L[0], V = L[1], Q = L[2];
    var n = between(rng, 1, 9);
    var base = between(rng, 0, 300);
    var open = between(rng, 35, 140);

    return {
      id: 'gen-naming-' + P + V + Q + '-' + n + '-' + base + '_' + open,
      type: 'angle-naming', source: 'generated',
      prompt: 'Name the angle in 4 different ways.',
      figure: { shape: 'rays', vertex: V,
                rays: [{ deg: base + open, label: Q }, { deg: base, label: P }],
                arcs: [{ from: 0, to: 1, label: String(n) }] },
      answer: blankSpec('∠' + Q + V + P),
      verify: function (a) { return a.value === '∠' + Q + V + P; },
      steps: [
        { say: 'Only one angle sits at this vertex, so the vertex letter alone names it:',
          template: '{a}', blanks: { a: '∠' + V } },
        { say: 'Name it by the number written inside it:',
          template: '{b}', blanks: { b: '∠' + n } },
        { say: 'Name it with three letters, starting from ' + P +
               '. The vertex always goes in the middle:',
          template: '{c}', blanks: { c: '∠' + P + V + Q } },
        { say: 'Now the same three letters the other way, starting from ' + Q + ':',
          template: '{d}', blanks: { d: '∠' + Q + V + P } }
      ]
    };
  }

  // ---- Classifying an angle by its drawn measure. Measures sit clear of the
  // boundaries so "drawn to scale" is a fair instruction: nothing lands at
  // 88° where acute and right are a judgement call.
  function genAngleClassify(rng) {
    var kind = between(rng, 1, 4);
    var deg = kind === 1 ? between(rng, 20, 75)
            : kind === 2 ? 90
            : kind === 3 ? between(rng, 105, 165)
            : 180;
    var base = between(rng, 0, 350);

    return {
      id: 'gen-classify-' + deg + '-' + base,
      type: 'angle-classify', source: 'generated',
      prompt: 'Classify this angle. Assume it is drawn to scale.',
      figure: { shape: 'rays',
                rays: [{ deg: base }, { deg: base + deg }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec(classifyAngle(deg)),
      verify: function (a) { return a.value === classifyAngle(deg); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: classifyAngle(deg) } }
      ]
    };
  }

  // ---- Congruency statements. The left side of each statement is given, so
  // the only thing being graded is the correspondence.
  function genCongruence(rng) {
    var L = letters(rng, 3);
    var R = letters(rng, 3, L);

    return {
      id: 'gen-cong-' + L.join('') + R.join(''),
      type: 'congruence', source: 'generated',
      prompt: 'Using the congruent triangles below, write the 6 congruency statements — one for each pair of congruent angles and each pair of congruent sides.',
      figure: { shape: 'triangles', left: L, right: R },
      answer: blankSpec(R[1] + R[2]),
      verify: function (a) { return a.value === R[1] + R[2]; },
      steps: [
        { say: 'The matching marks pair the vertices. Start with the angles:',
          template: '∠' + L[0] + ' ≅ {a}', blanks: { a: '∠' + R[0] } },
        { say: 'The second pair of angles:',
          template: '∠' + L[1] + ' ≅ {b}', blanks: { b: '∠' + R[1] } },
        { say: 'The third pair of angles:',
          template: '∠' + L[2] + ' ≅ {c}', blanks: { c: '∠' + R[2] } },
        { say: 'Now the sides. Each side is named by its two endpoints, so use the same pairing:',
          template: L[0] + L[1] + ' ≅ {d}', blanks: { d: R[0] + R[1] } },
        { say: 'The second pair of sides:',
          template: L[0] + L[2] + ' ≅ {e}', blanks: { e: R[0] + R[2] } },
        { say: 'The third pair of sides:',
          template: L[1] + L[2] + ' ≅ {f}', blanks: { f: R[1] + R[2] } }
      ]
    };
  }

  // ---- Angle Addition Postulate, in the study guide's two flavours: one
  // where the missing piece is a plain subtraction, one where both pieces
  // carry x and the whole thing becomes an equation.
  function genAngleAddition(rng) {
    var L = letters(rng, 4);
    var A = L[0], V = L[1], W = L[2], C = L[3];
    var inner = between(rng, 25, 70);
    var outer = between(rng, 30, 90);
    var total = inner + outer;
    var base = between(rng, 0, 300);
    var fig = { shape: 'rays', vertex: V,
                rays: [{ deg: base + total, label: C },
                       { deg: base + outer, label: W },
                       { deg: base, label: A }] };

    if (rng() < 0.5) {
      fig.arcs = [{ from: 0, to: 1, label: inner + '°' },
                  { from: 1, to: 2, label: 'x' }];
      return {
        id: 'gen-angadd-' + A + V + W + C + '-' + inner + '-' + total + '-' + base,
        type: 'angle-addition', source: 'generated',
        prompt: 'm∠' + C + V + A + ' = ' + total + '° and m∠' + C + V + W +
                ' = ' + inner + '°. Find m∠' + W + V + A + '.',
        figure: fig,
        answer: { kind: 'int', value: outer },
        verify: function (x) { return inner + x === total; },
        steps: [
          { say: 'Ray ' + V + W + ' is inside ∠' + C + V + A +
                 ', so the two small angles add to the big one:',
            template: 'm∠' + C + V + W + ' + m∠' + W + V + A +
                      ' = m∠' + C + V + A, blanks: {} },
          { say: 'Substitute the two measures you were given:',
            template: inner + ' + m∠' + W + V + A + ' = {a}',
            blanks: { a: total } },
          { say: 'Subtract ' + inner + ' from both sides:',
            template: 'm∠' + W + V + A + ' = {b}',
            blanks: { opL: opMark(inner), opR: opMark(inner), b: outer } }
        ]
      };
    }

    // Algebraic flavour: split the total into two linear expressions in x.
    var x = between(rng, 2, 9);
    var a1 = between(rng, 2, 12), a2 = between(rng, 2, 12);
    var b1 = between(rng, -10, 15);
    var b2 = total - (a1 * x + b1) - a2 * x;
    var coef = a1 + a2, cons = b1 + b2;
    if (a1 * x + b1 <= 0 || a2 * x + b2 <= 0) {
      // Degenerate split: fall back to the numeric flavour rather than print
      // a negative angle measure.
      fig.arcs = [{ from: 0, to: 1, label: inner + '°' },
                  { from: 1, to: 2, label: 'x' }];
      return {
        id: 'gen-angadd-' + A + V + W + C + '-' + inner + '-' + total + '-' + base,
        type: 'angle-addition', source: 'generated',
        prompt: 'm∠' + C + V + A + ' = ' + total + '° and m∠' + C + V + W +
                ' = ' + inner + '°. Find m∠' + W + V + A + '.',
        figure: fig,
        answer: { kind: 'int', value: outer },
        verify: function (v) { return inner + v === total; },
        steps: [
          { say: 'Ray ' + V + W + ' is inside ∠' + C + V + A +
                 ', so the two small angles add to the big one:',
            template: 'm∠' + C + V + W + ' + m∠' + W + V + A +
                      ' = m∠' + C + V + A, blanks: {} },
          { say: 'Substitute the two measures you were given:',
            template: inner + ' + m∠' + W + V + A + ' = {a}',
            blanks: { a: total } },
          { say: 'Subtract ' + inner + ' from both sides:',
            template: 'm∠' + W + V + A + ' = {b}',
            blanks: { opL: opMark(inner), opR: opMark(inner), b: outer } }
        ]
      };
    }

    fig.arcs = [{ from: 0, to: 1, label: expr(a1, b1) },
                { from: 1, to: 2, label: expr(a2, b2) }];
    var steps = [
      { say: 'Ray ' + V + W + ' is inside ∠' + C + V + A +
             ', so the two small angles add to the big one:',
        template: 'm∠' + C + V + W + ' + m∠' + W + V + A +
                  ' = m∠' + C + V + A, blanks: {} },
      { say: 'Substitute the expressions and combine like terms:',
        template: cons === 0 ? '{a}x = ' + total
                             : (cons < 0 ? '{a}x − {b} = ' + total
                                         : '{a}x + {b} = ' + total),
        blanks: cons === 0 ? { a: coef } : { a: coef, b: Math.abs(cons) } }
    ];
    if (cons !== 0) {
      steps.push({ say: undo(cons), template: sign(coef) + 'x = {c}',
                   blanks: { opL: opMark(cons), opR: opMark(cons),
                             c: total - cons } });
    }
    steps.push({ say: 'Divide both sides by ' + coef + ':', template: 'x = {d}',
                 blanks: { opL: divMark(coef), opR: divMark(coef), d: x } });

    return {
      id: 'gen-angadd2-' + A + V + W + C + '-' + a1 + '_' + b1 + '_' + total + '-' + base,
      type: 'angle-addition', source: 'generated',
      prompt: 'm∠' + C + V + W + ' = ' + expr(a1, b1) + ', m∠' + W + V + A +
              ' = ' + expr(a2, b2) + ', and m∠' + C + V + A + ' = ' + total +
              '°. Find x.',
      figure: fig,
      answer: { kind: 'int', value: x },
      verify: function (v) {
        return (a1 * v + b1) + (a2 * v + b2) === total;
      },
      steps: steps
    };
  }

  // ---- Angle bisectors, in all three directions the two study guides ask:
  // double a half to get the whole, halve the whole to get a half, or
  // recognise that the other half is simply equal. The last two are where the
  // damage happens -- one rewards doubling and one punishes it -- so the
  // generator produces all three rather than letting a drill train one reflex.
  function genBisector(rng) {
    var L = letters(rng, 3);
    var B = L[0], V = L[1], C = L[2];
    var half = between(rng, 10, 80);
    var base = between(rng, 0, 300);
    var fig = { shape: 'rays', vertex: V,
                rays: [{ deg: base + 2 * half, label: B },
                       { deg: base + half, label: 'P' },
                       { deg: base, label: C }],
                arcs: [{ from: 0, to: 1, label: '1' },
                       { from: 1, to: 2, label: '2' }],
                bisected: true };
    var which = between(rng, 1, 3);

    if (which === 1) {
      return {
        id: 'gen-bisect-whole-' + B + V + C + '-' + half + '-' + base,
        type: 'bisector', source: 'generated', ask: 'whole',
        prompt: V + 'P bisects ∠' + B + V + C + ' and m∠1 = ' + half +
                '°. Find m∠' + B + V + C + '.',
        figure: fig,
        answer: { kind: 'int', value: 2 * half },
        verify: function (v) { return v === 2 * half; },
        steps: [
          { say: 'A bisector cuts the angle into two equal halves, so ∠1 and ∠2 are both ' +
                 half + '°. Double one half:',
            template: 'm∠' + B + V + C + ' = 2 × ' + half + ' = {a}',
            blanks: { a: 2 * half } }
        ]
      };
    }
    if (which === 2) {
      return {
        id: 'gen-bisect-half-' + B + V + C + '-' + half + '-' + base,
        type: 'bisector', source: 'generated', ask: 'half',
        prompt: V + 'P bisects ∠' + B + V + C + ' and m∠' + B + V + C +
                ' = ' + (2 * half) + '°. Find m∠1.',
        figure: fig,
        answer: { kind: 'int', value: half },
        verify: function (v) { return v * 2 === 2 * half; },
        steps: [
          { say: 'A bisector cuts the angle into two equal halves. You were given the WHOLE angle this time, so halve it:',
            template: 'm∠1 = ' + (2 * half) + ' ÷ 2 = {a}',
            blanks: { a: half } }
        ]
      };
    }
    return {
      id: 'gen-bisect-other-' + B + V + C + '-' + half + '-' + base,
      type: 'bisector', source: 'generated', ask: 'other-half',
      prompt: V + 'P bisects ∠' + B + V + C + ' and m∠1 = ' + half +
              '°. Find m∠2.',
      figure: fig,
      answer: { kind: 'int', value: half },
      verify: function (v) { return v === half; },
      steps: [
        { say: 'The two halves a bisector makes are equal, so ∠2 measures the same as ∠1. No doubling and no halving here:',
          template: 'm∠2 = {a}', blanks: { a: half } }
      ]
    };
  }

  var BY_TYPE = {
    'segment-addition': genSegmentAddition,
    'distance': genDistance,
    'midpoint': genMidpoint,
    'angle-naming': genAngleNaming,
    'angle-classify': genAngleClassify,
    'congruence': genCongruence,
    'angle-addition': genAngleAddition,
    'bisector': genBisector
  };

  // djb2, enough to tell two prompts apart.
  function slug(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; }
    return h.toString(36);
  }

  function generate(type, rng) {
    var fn = BY_TYPE[type];
    if (!fn) throw new Error('unknown problem type: ' + type);
    var p = fn(rng);
    // The review list dedups by id. Several types print a CONSTANT prompt
    // ('Classify this angle.'), so the prompt slug alone would collapse every
    // one of them into a single row and silently drop the rest. Each base id
    // above therefore carries everything that varies -- measures, letters and
    // the figure's rotation -- and generators.test.js checks that it does.
    p.id = p.id + '-' + slug(p.prompt);
    return p;
  }

  globalThis.TYPES = TYPES;
  globalThis.makeRng = makeRng;
  globalThis.generate = generate;
})();
