// Targeted feedback for the misconceptions this test invites. Each detector
// recognises a specific wrong value; a wrong answer that matches none of them
// returns '' so the caller stays generic.
//
// Two of these come straight off the completed worksheet: the midpoint
// question was answered with the distance formula, and a bisector question
// was answered by doubling when the two halves were simply equal.
(function () {
  function num(text) {
    var s = String(text).replace(/−/g, '-').trim();
    return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
  }

  function correctValue(step, blankName) { return step.blanks[blankName]; }

  function letters(text) {
    return String(text).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // 1. Adding where the postulate calls for subtracting. The whole is the sum
  //    of the parts, so the missing part is total minus the known one.
  function addedInsteadOfSubtracted(c) {
    var m = c.step.say.match(/Subtract (\d+) from both sides/);
    if (!m) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null) return '';
    var n = parseInt(m[1], 10);
    if (got !== want + 2 * n) return '';
    return 'The two small pieces add up to the whole, so the missing piece is ' +
           'the whole minus ' + n + ' — subtract it, do not add it.';
  }

  // 2. Squaring a negative and keeping the sign. (−9)² is 81, not −81.
  function negativeSquare(c) {
    if (!/Square each one/i.test(c.step.say)) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null || got !== -want) return '';
    return 'A negative times a negative is positive, so squaring a negative ' +
           'never leaves a negative. (−' + Math.sqrt(Math.abs(want)) +
           ')² is ' + Math.abs(want) + '.';
  }

  // 3. Stopping at the radicand. The worksheet's own distance question ends
  //    √225 = 15, and 225 is the tempting thing to write down.
  function forgotTheRoot(c) {
    if (!/Take the square root/i.test(c.step.say)) return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null) return '';
    if (got !== want * want) return '';
    return 'That is what is under the radical, not the distance. ' +
           'Take the square root of ' + got + '.';
  }

  // 4. The midpoint answered without the halving step -- the sums, not the
  //    averages.
  function midpointNotHalved(c) {
    if (c.problem.type !== 'midpoint') return '';
    var sums = c.problem.steps[0].blanks;
    var typedPair = String(c.typed).replace(/[()\s]/g, '').replace(/−/g, '-');
    var want = String(sums.a) + ',' + String(sums.b);
    if (typedPair !== want) return '';
    return 'Those are the two sums. The midpoint is the AVERAGE of each pair ' +
           'of coordinates, so each sum still has to be divided by 2.';
  }

  // 5. The bisector mistakes. There are three directions and each has its own
  //    wrong answer, so the detector reads `problem.ask` rather than guessing:
  //    doubling when the halves are simply equal, handing back a half when the
  //    whole was wanted, and copying the whole across when a half was wanted.
  //    Part I sets up the first two; Part II #11a sets up the third.
  function bisectorHalving(c) {
    if (c.problem.type !== 'bisector') return '';
    var want = num(correctValue(c.step, c.blankName));
    var got = num(c.typed);
    if (want === null || got === null) return '';

    if (c.problem.ask === 'whole' && got * 2 === want) {
      return 'That is one half. The question asks for the whole angle, which ' +
             'is both halves together.';
    }
    if (c.problem.ask === 'other-half' && got === want * 2) {
      return 'A bisector makes two EQUAL halves, so the other half is the ' +
             'same measure — nothing gets doubled here. Doubling gives the ' +
             'whole angle, which is not what was asked.';
    }
    if (c.problem.ask === 'half' && got === want * 2) {
      return 'That is the whole angle you were given, not a half of it. ' +
             'The bisector splits it in two, so this one divides by 2 — it is ' +
             'the opposite of the doubling question.';
    }
    return '';
  }

  // 6. Naming an angle with the vertex out of position. The right letters in
  //    the wrong order is a different angle, not a spelling slip.
  function vertexNotInMiddle(c) {
    if (c.problem.type !== 'angle-naming') return '';
    var want = letters(correctValue(c.step, c.blankName));
    var got = letters(c.typed);
    if (want.length !== 3 || got.length !== 3) return '';
    if (got === want) return '';
    if (got.split('').sort().join('') !== want.split('').sort().join('')) return '';
    var vertex = want.charAt(1);
    if (got.charAt(1) === vertex) return '';
    return 'Right three letters, wrong order. The vertex goes in the MIDDLE, ' +
           'so ' + vertex + ' belongs between the other two.';
  }

  // 7. A congruency statement matched to the wrong vertex of the other
  //    triangle. The marks give the pairing; position on the page does not.
  function wrongCorrespondence(c) {
    if (c.problem.type !== 'congruence') return '';
    var f = c.problem.figure;
    if (!f || !f.right) return '';
    var want = letters(correctValue(c.step, c.blankName));
    var got = letters(c.typed);
    if (got === '' || got === want || got.length !== want.length) return '';
    for (var i = 0; i < got.length; i++) {
      if (f.right.indexOf(got.charAt(i)) === -1) return '';
    }
    return 'Those letters are from the right triangle, but they are not the ' +
           'matching ones. Count the tick marks and arcs — equal marks pair ' +
           'up, wherever the triangle happens to sit on the page.';
  }

  var DETECTORS = [addedInsteadOfSubtracted, negativeSquare, forgotTheRoot,
                   midpointNotHalved, bisectorHalving, vertexNotInMiddle,
                   wrongCorrespondence];

  function hintFor(context) {
    for (var i = 0; i < DETECTORS.length; i++) {
      var h = DETECTORS[i](context);
      if (h) return h;
    }
    return '';
  }

  globalThis.hintFor = hintFor;
})();
