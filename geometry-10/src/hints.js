// Targeted feedback for the five misconceptions visible on the completed
// study guides. Each detector recognises a specific wrong value; a wrong
// answer that matches none of them returns '' so the caller stays generic.
(function () {
  function num(text) {
    var s = String(text).replace(/−/g, '-').trim();
    return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
  }

  function correctValue(step, blankName) { return step.blanks[blankName]; }

  // 1. Subtracting a negative. The step's own wording flags it, and the
  //    telltale wrong answer is the sign-flipped correct one.
  function subtractNegative(c) {
    if (!/Subtracting a negative/i.test(c.step.say)) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null || got !== -want) return '';
    return 'Subtracting a negative is the same as adding. ' +
           '− (−' + Math.abs(want) + ') becomes + ' + Math.abs(want) + '.';
  }

  // 2. Dividing zero. He reached 2n = 0 and then wrote n = 2.
  function zeroQuotient(c) {
    if (num(correctValue(c.step, c.blankName)) !== 0) return '';
    var got = num(c.typed);
    if (got === null || got === 0) return '';
    var m = c.step.say.match(/Divide both sides by (−?-?\d+)/);
    if (!m) return '';
    var divisor = Math.abs(num(m[1].replace('−', '-')));
    if (Math.abs(got) !== divisor) return '';
    return '0 divided by ' + divisor + ' is 0, not ' + divisor + '. ' +
           'Zero split any number of ways is still zero.';
  }

  // 3. Moving a negative variable term. Subtracting -2x instead of adding it
  //    turns a coefficient of a+|b| into a-|b|.
  function negativeTermAcross(c) {
    // Case-insensitive: authored steps open with 'Add 2x…', generated ones
    // read '…together — add 2a to both sides'.
    var m = c.step.say.match(/add (\d+)([a-z]) to both sides/i);
    if (!m) return '';
    var moved = parseInt(m[1], 10);
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null) return '';
    if (got !== want - 2 * moved) return '';
    return 'That term is −' + moved + m[2] + ', already negative. ' +
           'To cancel it you add ' + moved + m[2] + ' to both sides, not subtract it.';
  }

  // 4. Cancelling a numerator against another numerator. The step names the
  //    two numbers that may legally cancel; anything else is the error.
  function badCrossCancel(c) {
    var m = c.step.say.match(/Cancel (\d+) and (\d+) by/);
    if (!m) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null || got === want) return '';
    var a = parseInt(m[1], 10);
    // Did they divide the first number by a factor it shares with some other
    // number in the problem, rather than with its own partner?
    if (got <= 0 || a % got !== 0) return '';
    return 'You can only cancel a top against a bottom. ' +
           'Check that the two numbers you cancelled are on opposite sides of a fraction bar.';
  }

  // 5. Swapped intercepts: the pair typed is the OTHER intercept's numbers.
  function swappedIntercepts(c) {
    if (c.problem.type !== 'intercepts') return '';
    var want = String(correctValue(c.step, c.blankName)).replace(/[()\s]/g, '');
    var got = String(c.typed).replace(/[()\s−]/g, function (ch) {
      return ch === '−' ? '-' : '';
    });
    var w = want.split(','), g = got.split(',');
    if (w.length !== 2 || g.length !== 2) return '';
    if (g[0] === w[0] && g[1] === w[1]) return '';
    var f = c.problem.figure;
    var other = (w[1] === '0') ? ['0', String(f.yInt)] : [String(f.xInt), '0'];
    // Only fire when the numbers are right but attached to the wrong axis.
    if (!(g[0] === other[1] && g[1] === other[0]) &&
        !(g[0] === other[0] && g[1] === other[1])) return '';
    return 'Check which axis each one crosses. The x-intercept has y = 0, ' +
           'and the y-intercept has x = 0.';
  }

  var DETECTORS = [subtractNegative, zeroQuotient, negativeTermAcross,
                   badCrossCancel, swappedIntercepts];

  function hintFor(context) {
    for (var i = 0; i < DETECTORS.length; i++) {
      var h = DETECTORS[i](context);
      if (h) return h;
    }
    return '';
  }

  globalThis.hintFor = hintFor;
})();
