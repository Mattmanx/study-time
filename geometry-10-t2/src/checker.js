// Answer comparison. One rule per answer kind. No DOM access.
//
// This started as a copy of geometry-10/src/checker.js. Four rules are new for
// Test #2, and each exists because the study guide asks for something Test #1
// never did:
//   * pairs with non-integer components  -- the midpoint of two odd coordinates
//   * decimal3                            -- "round to the nearest thousandths"
//   * segment                             -- DE and ED name the same segment
//   * angle                               -- the student may or may not type the angle sign
(function () {
  // Students type the unicode minus from a worksheet as often as a hyphen.
  function normalize(text) {
    return String(text == null ? '' : text)
      .replace(/−/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a || 1;
  }

  function parseInteger(text) {
    var s = normalize(text);
    return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
  }

  function parseFraction(text) {
    var s = normalize(text);
    var m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) {
      var den = parseInt(m[2], 10);
      if (den === 0) return null;
      return { num: parseInt(m[1], 10), den: den };
    }
    var whole = parseInteger(s);
    return whole === null ? null : { num: whole, den: 1 };
  }

  function reduce(f) {
    var g = gcd(f.num, f.den);
    var num = f.num / g, den = f.den / g;
    if (den < 0) { num = -num; den = -den; }
    return { num: num, den: den };
  }

  // Everything parseFraction reads, plus decimals. Kept separate from
  // parseFraction so the 'fraction' kind keeps rejecting decimals: there,
  // "write it as a fraction" is the instruction being graded.
  function parseNumber(text) {
    var s = normalize(text);
    var m = s.match(/^([+-]?)(\d*)\.(\d+)$/);
    if (m) {
      var digits = m[3];
      var whole = m[2] === '' ? 0 : parseInt(m[2], 10);
      var den = Math.pow(10, digits.length);
      var num = whole * den + parseInt(digits, 10);
      return reduce({ num: m[1] === '-' ? -num : num, den: den });
    }
    var f = parseFraction(s);
    return f === null ? null : reduce(f);
  }

  function isReduced(f) {
    return gcd(f.num, f.den) === 1 && f.den > 0;
  }

  function sameValue(a, b) { return a.num * b.den === b.num * a.den; }

  // A midpoint lands on a half whenever the two coordinates differ in parity,
  // so components go through parseNumber rather than parseInteger. Both
  // (-1.5, -2) and (-3/2, -2) are the same answer and both are accepted.
  function parsePair(text) {
    var s = normalize(text).replace(/^\(|\)$/g, '');
    var parts = s.split(',');
    if (parts.length !== 2) return null;
    var x = parseNumber(parts[0]), y = parseNumber(parts[1]);
    return (x === null || y === null) ? null : { x: x, y: y };
  }

  function checkPair(text, spec) {
    var p = parsePair(text);
    if (p === null) return { status: 'malformed' };
    return { status: (sameValue(p.x, spec.x) && sameValue(p.y, spec.y))
                     ? 'correct' : 'wrong' };
  }

  // Type 7 demands exactly two decimal places -- "15.8" is not an answer
  // rounded to hundredths, it is an answer rounded to tenths.
  function checkDecimal2(text, spec) {
    var s = normalize(text);
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return { status: 'malformed' };
    if (!/^[+-]?\d+\.\d{2}$/.test(s)) return { status: 'needs-hundredths' };
    return { status: parseFloat(s) === spec.value ? 'correct' : 'wrong' };
  }

  // Same discipline one place further out, for the distance formula.
  function checkDecimal3(text, spec) {
    var s = normalize(text);
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return { status: 'malformed' };
    if (!/^[+-]?\d+\.\d{3}$/.test(s)) return { status: 'needs-thousandths' };
    return { status: parseFloat(s) === spec.value ? 'correct' : 'wrong' };
  }

  function parseRadical(text) {
    var s = normalize(text).toLowerCase()
      .replace(/√/g, ' sqrt ')
      .replace(/\bsqrt\b/g, ' sqrt ')
      .replace(/(\d)\s*r\s*(\d)/g, '$1 sqrt $2')
      .replace(/^\s*r\s*(\d)/, ' sqrt $1')
      .replace(/\s+/g, ' ')
      .trim();
    var m = s.match(/^(\d*)\s*sqrt\s*(\d+)$/);
    if (!m) return null;
    return { coef: m[1] === '' ? 1 : parseInt(m[1], 10), rad: parseInt(m[2], 10) };
  }

  function checkRadical(text, spec) {
    var s = normalize(text);
    // A bare decimal means the calculator button was used -- explicitly banned.
    if (/^[+-]?\d+\.\d+$/.test(s)) return { status: 'needs-exact' };
    var r = parseRadical(s);
    if (r === null) return { status: 'malformed' };
    return { status: (r.coef === spec.coef && r.rad === spec.rad) ? 'correct' : 'wrong' };
  }

  // Operation notation: a keyboard has no ÷ or ×, so accept what it offers.
  function normalizeOp(text) {
    return normalize(text).toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[*x]/g, '×')
      .replace(/\//g, '÷');
  }

  function checkOp(text, spec) {
    var s = normalizeOp(text);
    if (s === '') return { status: 'malformed' };
    return { status: s === spec.value ? 'correct' : 'wrong' };
  }

  function checkSigns(text, spec) {
    var s = normalize(text).replace(/[()\s]/g, '');
    var parts = s.split(',');
    if (parts.length !== 2 || !/^[+-]$/.test(parts[0]) || !/^[+-]$/.test(parts[1])) {
      return { status: 'malformed' };
    }
    return { status: (parts[0] === spec.x && parts[1] === spec.y) ? 'correct' : 'wrong' };
  }

  function labelKey(v) {
    return normalize(v).toLowerCase().replace(/[\s-]+/g, '');
  }

  function checkLabel(text, spec) {
    var s = labelKey(text);
    if (s === '') return { status: 'malformed' };
    return { status: s === labelKey(spec.value) ? 'correct' : 'wrong' };
  }

  // A segment has no direction: DE and ED are the same segment, and the
  // congruency statements on the study guide are written both ways on the
  // same page. Sorting the endpoints is the whole rule.
  function segmentKey(v) {
    var s = normalize(v).toUpperCase().replace(/[^A-Z]/g, '');
    return s.split('').sort().join('');
  }

  function checkSegment(text, spec) {
    var s = segmentKey(text);
    if (s.length !== 2) return { status: 'malformed' };
    return { status: s === segmentKey(spec.value) ? 'correct' : 'wrong' };
  }

  // The angle sign is a nuisance to type, so ∠DEF, <DEF, "angle DEF" and a
  // bare DEF are all the same entry. Letter ORDER still matters: naming an
  // angle by three points is exactly the skill being graded, and the question
  // says which endpoint to list first.
  //
  // The "m" of "m∠ABC" is only dropped while the sign is still attached. A
  // bare leading m is a vertex named M -- stripping it after the sign was
  // removed turned ∠M into the empty string, which graded as malformed, and a
  // malformed answer costs no attempt: that blank could never be passed. It is
  // the third statement of the study guide's own congruence problem.
  function angleKey(v) {
    return normalize(v).toLowerCase()
      .replace(/^m(?=∠|<)/, '')
      .replace(/∠/g, '').replace(/</g, '')
      .replace(/\bangle\b/g, '')
      .replace(/[\s.]+/g, '');
  }

  function checkAngle(text, spec) {
    var s = angleKey(text);
    if (s === '') return { status: 'malformed' };
    return { status: s === angleKey(spec.value) ? 'correct' : 'wrong' };
  }

  function checkAnswer(text, spec) {
    if (spec.kind === 'int') {
      var n = parseInteger(text);
      if (n === null) {
        // An integer written to a rounding place is still that integer:
        // a distance of exactly 15 may be handed in as 15.000.
        var f = parseNumber(text);
        if (f === null) return { status: 'malformed' };
        // A readable number that is not a whole number is a wrong answer,
        // not an unreadable one -- saying "that is not a number" about 15.001
        // sends the student looking for a typo instead of for the mistake.
        if (f.den !== 1) return { status: 'wrong' };
        n = f.num;
      }
      return { status: n === spec.value ? 'correct' : 'wrong' };
    }
    if (spec.kind === 'fraction') {
      var fr = parseFraction(text);
      if (fr === null) return { status: 'malformed' };
      if (!sameValue(fr, spec)) return { status: 'wrong' };
      return { status: isReduced(fr) ? 'correct' : 'unreduced' };
    }
    if (spec.kind === 'pair') return checkPair(text, spec);
    if (spec.kind === 'op') return checkOp(text, spec);
    if (spec.kind === 'decimal2') return checkDecimal2(text, spec);
    if (spec.kind === 'decimal3') return checkDecimal3(text, spec);
    if (spec.kind === 'radical') return checkRadical(text, spec);
    if (spec.kind === 'signs') return checkSigns(text, spec);
    if (spec.kind === 'segment') return checkSegment(text, spec);
    if (spec.kind === 'angle') return checkAngle(text, spec);
    if (spec.kind === 'label') return checkLabel(text, spec);
    throw new Error('unknown answer kind: ' + spec.kind);
  }

  // A step blank declares a plain value; its grading rule is inferred from
  // the shape of that value, so problem data stays free of type tags.
  function blankSpec(value) {
    if (typeof value === 'number') return { kind: 'int', value: value };
    var s = normalize(value);
    if (s.indexOf(',') !== -1) {
      var pr = parsePair(s);
      if (pr) return { kind: 'pair', x: pr.x, y: pr.y };
      var q = s.replace(/[()\s]/g, '').split(',');
      if (q.length === 2 && /^[+-]$/.test(q[0]) && /^[+-]$/.test(q[1])) {
        return { kind: 'signs', x: q[0], y: q[1] };
      }
      return { kind: 'label', value: s };
    }
    if (/^[×÷*\/]/.test(s)) return { kind: 'op', value: normalizeOp(s) };
    // Anything carrying the angle sign is an angle name, including ∠5.
    if (s.indexOf('∠') !== -1) return { kind: 'angle', value: s };
    // Two bare capitals name a segment; a single letter or a word does not.
    if (/^[A-Z]{2}$/.test(s)) return { kind: 'segment', value: s };
    var r = parseRadical(s);
    if (r) return { kind: 'radical', coef: r.coef, rad: r.rad };
    if (s.indexOf('/') !== -1) {
      var f = parseFraction(s);
      if (f) return { kind: 'fraction', num: f.num, den: f.den };
    }
    if (/^[+-]?\d+\.\d{3}$/.test(s)) return { kind: 'decimal3', value: parseFloat(s) };
    if (/^[+-]?\d+\.\d+$/.test(s)) return { kind: 'decimal2', value: parseFloat(s) };
    if (/^[+-]?\d+$/.test(s)) return { kind: 'int', value: parseInt(s, 10) };
    if (/^[+-]\d+[a-z]$/i.test(s)) return { kind: 'op', value: normalizeOp(s) };
    return { kind: 'label', value: s };
  }

  // How a pair component reads back on the review screen. Halves are the only
  // fractions a midpoint produces, and -1.5 is how the worksheet writes one.
  function fractionText(f) {
    if (f.den === 1) return String(f.num);
    if (f.den === 2 || f.den === 4 || f.den === 5 || f.den === 10) {
      return String(f.num / f.den);
    }
    return f.num + '/' + f.den;
  }

  globalThis.checkAnswer = checkAnswer;
  globalThis.gcd = gcd;
  globalThis.parseFraction = parseFraction;
  globalThis.parseNumber = parseNumber;
  globalThis.blankSpec = blankSpec;
  globalThis.fractionText = fractionText;
})();
