// Answer comparison. One rule per answer kind. No DOM access.
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

  function isReduced(f) {
    return gcd(f.num, f.den) === 1 && f.den > 0;
  }

  function sameValue(a, b) { return a.num * b.den === b.num * a.den; }

  function parsePair(text) {
    var s = normalize(text).replace(/^\(|\)$/g, '');
    var parts = s.split(',');
    if (parts.length !== 2) return null;
    var x = parseInteger(parts[0]), y = parseInteger(parts[1]);
    return (x === null || y === null) ? null : { x: x, y: y };
  }

  // Type 7 demands exactly two decimal places -- "15.8" is not an answer
  // rounded to hundredths, it is an answer rounded to tenths.
  function checkDecimal2(text, spec) {
    var s = normalize(text);
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return { status: 'malformed' };
    if (!/^[+-]?\d+\.\d{2}$/.test(s)) return { status: 'needs-hundredths' };
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

  function checkLabel(text, spec) {
    function key(v) { return normalize(v).toLowerCase().replace(/[\s-]+/g, ''); }
    var s = key(text);
    if (s === '') return { status: 'malformed' };
    return { status: s === key(spec.value) ? 'correct' : 'wrong' };
  }

  function checkAnswer(text, spec) {
    if (spec.kind === 'int') {
      var n = parseInteger(text);
      if (n === null) return { status: 'malformed' };
      return { status: n === spec.value ? 'correct' : 'wrong' };
    }
    if (spec.kind === 'fraction') {
      var f = parseFraction(text);
      if (f === null) return { status: 'malformed' };
      if (!sameValue(f, spec)) return { status: 'wrong' };
      return { status: isReduced(f) ? 'correct' : 'unreduced' };
    }
    if (spec.kind === 'pair') {
      var p = parsePair(text);
      if (p === null) return { status: 'malformed' };
      return { status: (p.x === spec.x && p.y === spec.y) ? 'correct' : 'wrong' };
    }
    if (spec.kind === 'op') return checkOp(text, spec);
    if (spec.kind === 'decimal2') return checkDecimal2(text, spec);
    if (spec.kind === 'radical') return checkRadical(text, spec);
    if (spec.kind === 'signs') return checkSigns(text, spec);
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
    var r = parseRadical(s);
    if (r) return { kind: 'radical', coef: r.coef, rad: r.rad };
    if (s.indexOf('/') !== -1) {
      var f = parseFraction(s);
      if (f) return { kind: 'fraction', num: f.num, den: f.den };
    }
    if (/^[+-]?\d+\.\d+$/.test(s)) return { kind: 'decimal2', value: parseFloat(s) };
    if (/^[+-]?\d+$/.test(s)) return { kind: 'int', value: parseInt(s, 10) };
    if (/^[+-]\d+[a-z]$/i.test(s)) return { kind: 'op', value: normalizeOp(s) };
    return { kind: 'label', value: s };
  }

  globalThis.checkAnswer = checkAnswer;
  globalThis.gcd = gcd;
  globalThis.parseFraction = parseFraction;
  globalThis.blankSpec = blankSpec;
})();
