// The study guide problems, as data.
//
// UNLIKE Test #1, THERE IS NO TEACHER ANSWER KEY FOR THIS TEST. reference/
// holds two scans of the same worksheet -- the second one ("Part 2") is the
// same nine questions after corrections, not a new assignment. Every answer
// here was derived independently from the printed question, and each problem
// carries a `verify` that recomputes it from the figure's own numbers. If an
// answer looks wrong, re-derive it -- do NOT "correct" it against handwriting.
//
// The corrected scan CONFIRMS all three answers that had to be derived:
//   * Q5 asks for the MIDPOINT. The first scan re-ran the distance formula;
//     the corrected one works the midpoint formula and reaches (−1.5, −2),
//     which is what this file already said.
//   * Q3 solves to x = 5. The first scan showed a struck-out x = 1.
//   * Q8's correspondence is D↔L, E↔K, C↔M. Both scans agree, and the
//     corrected one writes the sides as LK, ML and MK -- the same three
//     segments this file names as LK, LM and KM. A segment has no direction,
//     so both orders are accepted; see checker.js.
//   * The Part I vocabulary blanks 1a and 1f were swapped on the first scan
//     and are corrected on the second, to Segment and Collinear respectively.
//     Those live in geometry-10-t2-vocab, not here.
(function () {
  // A chain is trustworthy only if its last step lands exactly on the
  // declared answer. Anything else means the transcription drifted.
  function walkProblem(p) {
    if (!p.steps || p.steps.length === 0) {
      return { ok: false, error: 'no steps' };
    }
    var last = p.steps[p.steps.length - 1];
    var keys = Object.keys(last.blanks);
    if (keys.length === 0) {
      return { ok: false, error: 'final step has no blank' };
    }
    // Steps may carry operation blanks before the result; the answer is the
    // last blank filled, not the only one.
    var final = last.blanks[keys[keys.length - 1]];
    var result = checkAnswer(String(final), p.answer);
    if (result.status !== 'correct') {
      return { ok: false, error: 'final blank ' + final + ' is ' + result.status };
    }
    return { ok: true, error: '' };
  }

  // Scalar answers verify against a bare number; every other kind needs the
  // whole spec, since its value lives in several fields.
  function verifyArg(answer) {
    var scalar = answer.kind === 'int' || answer.kind === 'decimal2' ||
                 answer.kind === 'decimal3';
    return scalar ? answer.value : answer;
  }

  // The classification rule itself, written once. Problems verify their
  // declared label against the degrees actually drawn in their figure, so a
  // figure and its answer cannot drift apart.
  function classify(deg) {
    if (deg === 180) return 'straight angle';
    if (deg === 90) return 'right angle';
    return deg < 90 ? 'acute angle' : 'obtuse angle';
  }

  var PROBLEMS = [
    // ---- Type: Segment Addition Postulate (Part II #3)
    { id: 'sg2-3', type: 'segment-addition', source: 'SG2 #3',
      prompt: 'Use the figure to write an equation with the Segment Addition Postulate, then solve for x.',
      figure: { shape: 'segment', names: ['K', 'L', 'M'], at: 0.45,
                left: '2x − 2', right: '2x − 7', total: '11' },
      answer: { kind: 'int', value: 5 },
      verify: function (x) { return (2 * x - 2) + (2 * x - 7) === 11; },
      steps: [
        { say: 'The two short pieces make the whole. Name the whole segment:',
          template: 'KL + LM = {a}', blanks: { a: 'KM' } },
        { say: 'Substitute the expressions and combine like terms:',
          template: '{a}x − {b} = 11', blanks: { a: 4, b: 9 } },
        { say: 'Add 9 to both sides:',
          template: '4x = {c}', blanks: { opL: '+9', opR: '+9', c: 20 } },
        { say: 'Divide both sides by 4:',
          template: 'x = {d}', blanks: { opL: '÷4', opR: '÷4', d: 5 } }
      ] },

    // ---- Type: distance formula (Part II #4)
    // A(3, −8), B(−6, 4). Δx = −9, Δy = 12, so d = √225 = 15 exactly.
    { id: 'sg2-4', type: 'distance', source: 'SG2 #4',
      prompt: 'Find the DISTANCE of the line segment from A (3, −8) to B (−6, 4). Round to the nearest thousandth if necessary.',
      answer: { kind: 'int', value: 15 },
      verify: function (d) {
        return d * d === (-6 - 3) * (-6 - 3) + (4 - -8) * (4 - -8);
      },
      steps: [
        { say: 'Subtract the x-coordinates, then the y-coordinates:',
          template: 'd = √( ({a})² + ({b})² )', blanks: { a: -9, b: 12 } },
        { say: 'Square each one. A negative squared is positive:',
          template: 'd = √( {c} + {d} )', blanks: { c: 81, d: 144 } },
        { say: 'Add what is under the radical:',
          template: 'd = √{e}', blanks: { e: 225 } },
        { say: 'Take the square root. This one comes out exact:',
          template: 'd = {f}', blanks: { f: 15 } }
      ] },

    // ---- Type: midpoint formula (Part II #5)
    // The worksheet answers this one with the distance formula. It asks for
    // the midpoint: ((3 + −6)/2, (−8 + 4)/2) = (−1.5, −2).
    { id: 'sg2-5', type: 'midpoint', source: 'SG2 #5',
      prompt: 'Find the MIDPOINT of the segment from A (3, −8) to B (−6, 4).',
      answer: blankSpec('(−1.5, −2)'),
      verify: function (m) {
        return (3 + -6) * m.x.den === 2 * m.x.num &&
               (-8 + 4) * m.y.den === 2 * m.y.num;
      },
      steps: [
        { say: 'Add the x-coordinates, then add the y-coordinates:',
          template: 'M = ( {a}/2 , {b}/2 )', blanks: { a: -3, b: -4 } },
        { say: 'Divide each sum by 2. Halves are fine — write it as a decimal:',
          template: 'M = {c}', blanks: { c: '(−1.5, −2)' } }
      ] },

    // ---- Type: naming an angle four ways (Part II #6)
    // Rays ED and EF from vertex E; the angle is numbered 5.
    { id: 'sg2-6', type: 'angle-naming', source: 'SG2 #6',
      prompt: 'Name the angle in 4 different ways.',
      figure: { shape: 'rays', vertex: 'E',
                rays: [{ deg: 90, label: 'F' }, { deg: -40, label: 'D' }],
                arcs: [{ from: 0, to: 1, label: '5' }] },
      answer: blankSpec('∠FED'),
      verify: function (a) {
        var s = String(a.value).replace('∠', '');
        return s.length === 3 && s.charAt(1) === 'E' &&
               s.charAt(0) === 'F' && s.charAt(2) === 'D';
      },
      steps: [
        { say: 'Only one angle sits at this vertex, so the vertex letter alone names it:',
          template: '{a}', blanks: { a: '∠E' } },
        { say: 'Name it by the number written inside it:',
          template: '{b}', blanks: { b: '∠5' } },
        { say: 'Name it with three letters, starting from D. The vertex always goes in the middle:',
          template: '{c}', blanks: { c: '∠DEF' } },
        { say: 'Now the same three letters the other way, starting from F:',
          template: '{d}', blanks: { d: '∠FED' } }
      ] },

    // ---- Type: classifying angles (Part II #7 a-d)
    { id: 'sg2-7a', type: 'angle-classify', source: 'SG2 #7a',
      prompt: 'Classify this angle. Assume it is drawn to scale.',
      figure: { shape: 'rays', rays: [{ deg: 0 }, { deg: 180 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('straight angle'),
      verify: function (a) { return a.value === classify(180); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'straight angle' } }
      ] },

    { id: 'sg2-7b', type: 'angle-classify', source: 'SG2 #7b',
      prompt: 'Classify this angle. Assume it is drawn to scale.',
      figure: { shape: 'rays', rays: [{ deg: 90 }, { deg: 180 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('right angle'),
      verify: function (a) { return a.value === classify(90); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'right angle' } }
      ] },

    { id: 'sg2-7c', type: 'angle-classify', source: 'SG2 #7c',
      prompt: 'Classify this angle. Assume it is drawn to scale.',
      figure: { shape: 'rays', rays: [{ deg: 90 }, { deg: 50 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('acute angle'),
      verify: function (a) { return a.value === classify(40); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'acute angle' } }
      ] },

    { id: 'sg2-7d', type: 'angle-classify', source: 'SG2 #7d',
      prompt: 'Classify this angle. Assume it is drawn to scale.',
      figure: { shape: 'rays', rays: [{ deg: 100 }, { deg: -35 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('obtuse angle'),
      verify: function (a) { return a.value === classify(135); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'obtuse angle' } }
      ] },

    // ---- Type: congruency statements (Part II #8)
    // Triangle DEC ≅ triangle LKM. The tick marks give the correspondence
    // D↔L, E↔K, C↔M; every statement below follows from that one map.
    //
    // This is the ONE answer on the sheet that is not derivable from the
    // printed text: the correspondence has to be read off the tick marks and
    // arcs in the scan. `verify` below can only check the map against itself,
    // so if this problem ever looks wrong, go back to the scans, not to the
    // code -- but note that BOTH scans in reference/ give this same map, which
    // is as much corroboration as this question is ever going to get.
    { id: 'sg2-8', type: 'congruence', source: 'SG2 #8',
      prompt: 'Using the congruent triangles below, write the 6 congruency statements — one for each pair of congruent angles and each pair of congruent sides.',
      figure: { shape: 'triangles', left: ['D', 'E', 'C'], right: ['L', 'K', 'M'] },
      answer: blankSpec('KM'),
      verify: function (a) {
        var map = { D: 'L', E: 'K', C: 'M' };
        return String(a.value) === map.E + map.C;
      },
      steps: [
        { say: 'The matching marks pair the vertices. Start with the angles:',
          template: '∠D ≅ {a}', blanks: { a: '∠L' } },
        { say: 'The second pair of angles:',
          template: '∠E ≅ {b}', blanks: { b: '∠K' } },
        { say: 'The third pair of angles:',
          template: '∠C ≅ {c}', blanks: { c: '∠M' } },
        { say: 'Now the sides. Each side is named by its two endpoints, so use the same pairing:',
          template: 'DE ≅ {d}', blanks: { d: 'LK' } },
        { say: 'The second pair of sides:',
          template: 'DC ≅ {e}', blanks: { e: 'LM' } },
        { say: 'The third pair of sides:',
          template: 'EC ≅ {f}', blanks: { f: 'KM' } }
      ] },

    // ---- Type: Angle Addition Postulate (Part II #9 a-b)
    // 9a: m∠CBA = 163°, m∠CBW = 48°. Ray BW is inside ∠CBA, so 48 + x = 163.
    { id: 'sg2-9a', type: 'angle-addition', source: 'SG2 #9a',
      prompt: 'm∠CBA = 163° and m∠CBW = 48°. Find m∠WBA.',
      figure: { shape: 'rays', vertex: 'B',
                rays: [{ deg: 105, label: 'C' }, { deg: 62, label: 'W' },
                       { deg: -58, label: 'A' }],
                arcs: [{ from: 0, to: 1, label: '48°' },
                       { from: 1, to: 2, label: 'x' }] },
      answer: { kind: 'int', value: 115 },
      verify: function (x) { return 48 + x === 163; },
      steps: [
        { say: 'Ray BW is inside ∠CBA, so the two small angles add to the big one:',
          template: 'm∠CBW + m∠WBA = m∠CBA', blanks: {} },
        { say: 'Substitute the two measures you were given:',
          template: '48 + m∠WBA = {a}', blanks: { a: 163 } },
        { say: 'Subtract 48 from both sides:',
          template: 'm∠WBA = {b}', blanks: { opL: '-48', opR: '-48', b: 115 } }
      ] },

    // 9b: m∠RSQ = 10x + 10, m∠QST = 10x − 3, m∠RST = 127°.
    { id: 'sg2-9b', type: 'angle-addition', source: 'SG2 #9b',
      prompt: 'm∠QST = 10x − 3, m∠RST = 127°, and m∠RSQ = 10x + 10. Find x.',
      figure: { shape: 'rays', vertex: 'S',
                rays: [{ deg: 128, label: 'R' }, { deg: 74, label: 'Q' },
                       { deg: 0, label: 'T' }],
                arcs: [{ from: 0, to: 1, label: '10x + 10' },
                       { from: 1, to: 2, label: '10x − 3' }] },
      answer: { kind: 'int', value: 6 },
      verify: function (x) { return (10 * x + 10) + (10 * x - 3) === 127; },
      steps: [
        { say: 'Ray SQ is inside ∠RST, so the two small angles add to the big one:',
          template: 'm∠RSQ + m∠QST = m∠RST', blanks: {} },
        { say: 'Substitute the expressions and combine like terms:',
          template: '{a}x + {b} = 127', blanks: { a: 20, b: 7 } },
        { say: 'Subtract 7 from both sides:',
          template: '20x = {c}', blanks: { opL: '-7', opR: '-7', c: 120 } },
        { say: 'Divide both sides by 20:',
          template: 'x = {d}', blanks: { opL: '÷20', opR: '÷20', d: 6 } }
      ] },

    // ---- Type: angle bisectors (Part II, second #8 a-b)
    // A bisector makes two equal halves. (a) doubles a half to get the whole;
    // (b) is the other direction -- the other half is simply equal.
    { id: 'sg2-b8a', type: 'bisector', source: 'SG2 #8a (bisectors)',
      prompt: 'DP bisects ∠BDC and m∠1 = 12°. Find m∠BDC.',
      // Not to scale: at its true 12° per half this is an unreadable sliver,
      // and unlike #7 this question states the measure rather than asking the
      // student to read it off the picture.
      figure: { shape: 'rays', vertex: 'D',
                rays: [{ deg: 118, label: 'B' }, { deg: 80, label: 'P' },
                       { deg: 42, label: 'C' }],
                arcs: [{ from: 0, to: 1, label: '1' },
                       { from: 1, to: 2, label: '2' }], bisected: true },
      ask: 'whole',
      answer: { kind: 'int', value: 24 },
      verify: function (v) { return v === 2 * 12; },
      steps: [
        { say: 'A bisector cuts the angle into two equal halves, so ∠1 and ∠2 are both 12°. Double one half:',
          template: 'm∠BDC = 2 × 12 = {a}', blanks: { a: 24 } }
      ] },

    { id: 'sg2-b8b', type: 'bisector', source: 'SG2 #8b (bisectors)',
      prompt: 'RP bisects the angle at R and m∠1 = 45°. Find m∠2.',
      // Not to scale, for the same reason as (a).
      figure: { shape: 'rays', vertex: 'R',
                rays: [{ deg: 186, label: 'T' }, { deg: 226, label: 'P' },
                       { deg: 266, label: 'S' }],
                arcs: [{ from: 0, to: 1, label: '1' },
                       { from: 1, to: 2, label: '2' }], bisected: true },
      ask: 'other-half',
      answer: { kind: 'int', value: 45 },
      verify: function (v) { return v === 45; },
      steps: [
        { say: 'The two halves a bisector makes are equal, so ∠2 measures the same as ∠1. No doubling here:',
          template: 'm∠2 = {a}', blanks: { a: 45 } }
      ] },

    // ================= Study Guide #2 PART II =================
    // Same eight topics and the same sections as Part I, all new numbers.
    // Part II adds one thing the tool did not have: a bisector question that
    // gives the WHOLE angle and asks for a half (#11a). Part I only ever went
    // the other way, so `ask` now distinguishes all three directions.

    // ---- Part II #3.  E--D--C with ED = 7x − 1, DC = 11x, EC = 17.
    { id: 'sg2b-3', type: 'segment-addition', source: 'SG2 Part II #3',
      prompt: 'Use the figure to write an equation with the Segment Addition Postulate, then solve for x.',
      figure: { shape: 'segment', names: ['E', 'D', 'C'], at: 0.42,
                left: '7x − 1', right: '11x', total: '17' },
      answer: { kind: 'int', value: 1 },
      verify: function (x) { return (7 * x - 1) + 11 * x === 17; },
      steps: [
        { say: 'The two short pieces make the whole. Name the whole segment:',
          template: 'ED + DC = {a}', blanks: { a: 'EC' } },
        { say: 'Substitute the expressions and combine like terms:',
          template: '{a}x − {b} = 17', blanks: { a: 18, b: 1 } },
        { say: 'Add 1 to both sides:',
          template: '18x = {c}', blanks: { opL: '+1', opR: '+1', c: 18 } },
        { say: 'Divide both sides by 18:',
          template: 'x = {d}', blanks: { opL: '÷18', opR: '÷18', d: 1 } }
      ] },

    // ---- Part II #4.  (−2, −4) to (−8, 2). Δx = −6, Δy = 6, so d = √72,
    // which does NOT come out exact: 8.485. This is the first authored
    // question that actually needs the "round to thousandths" rule.
    //
    // The worksheet boxes two contradictory answers here, 8.485 and 11.66.
    // The 11.66 computed 8 − (−2) = 10, dropping the minus sign on −8.
    { id: 'sg2b-4', type: 'distance', source: 'SG2 Part II #4',
      prompt: 'Find the DISTANCE of the line segment from (−2, −4) to (−8, 2). Round to the nearest thousandth if necessary.',
      answer: blankSpec('8.485'),
      verify: function (d) {
        var sq = (-8 - -2) * (-8 - -2) + (2 - -4) * (2 - -4);
        return Math.abs(d * d - sq) < 0.05;
      },
      steps: [
        { say: 'Subtract the x-coordinates, then the y-coordinates. Both starting values are negative, so watch the signs:',
          template: 'd = √( ({a})² + ({b})² )', blanks: { a: -6, b: 6 } },
        { say: 'Square each one. A negative squared is positive:',
          template: 'd = √( {c} + {d} )', blanks: { c: 36, d: 36 } },
        { say: 'Add what is under the radical:',
          template: 'd = √{e}', blanks: { e: 72 } },
        { say: 'This one is not a perfect square. Take the square root and round to three decimal places:',
          template: 'd = {f}', blanks: { f: '8.485' } }
      ] },

    // ---- Part II #5.  Same two points as #4; the midpoint is a lattice
    // point this time. The worksheet boxes two answers here as well, (−3, 3)
    // and (−5, −1); the (−3, 3) subtracted the coordinates instead of adding.
    { id: 'sg2b-5', type: 'midpoint', source: 'SG2 Part II #5',
      prompt: 'Find the MIDPOINT of the line segment from (−2, −4) to (−8, 2).',
      answer: blankSpec('(−5, −1)'),
      verify: function (m) {
        return (-2 + -8) * m.x.den === 2 * m.x.num &&
               (-4 + 2) * m.y.den === 2 * m.y.num;
      },
      steps: [
        { say: 'ADD the x-coordinates, then add the y-coordinates. Adding, not subtracting — that is the difference between this and the distance formula:',
          template: 'M = ( {a}/2 , {b}/2 )', blanks: { a: -10, b: -2 } },
        { say: 'Divide each sum by 2:',
          template: 'M = {c}', blanks: { c: '(−5, −1)' } }
      ] },

    // ---- Part II #6.  Rays GF and GH from vertex G; the angle is numbered 3.
    { id: 'sg2b-6', type: 'angle-naming', source: 'SG2 Part II #6',
      prompt: 'Name the angle in 4 different ways.',
      figure: { shape: 'rays', vertex: 'G',
                rays: [{ deg: 5, label: 'F' }, { deg: 215, label: 'H' }],
                arcs: [{ from: 0, to: 1, label: '3' }] },
      answer: blankSpec('∠FGH'),
      verify: function (a) {
        var s = String(a.value).replace('∠', '');
        return s.length === 3 && s.charAt(1) === 'G' &&
               s.charAt(0) === 'F' && s.charAt(2) === 'H';
      },
      steps: [
        { say: 'Only one angle sits at this vertex, so the vertex letter alone names it:',
          template: '{a}', blanks: { a: '∠G' } },
        { say: 'Name it by the number written inside it:',
          template: '{b}', blanks: { b: '∠3' } },
        { say: 'Name it with three letters, starting from H. The vertex always goes in the middle:',
          template: '{c}', blanks: { c: '∠HGF' } },
        { say: 'Now the same three letters the other way, starting from F:',
          template: '{d}', blanks: { d: '∠FGH' } }
      ] },

    // ---- Part II #7 a-d. Part II prints them in a different order from
    // Part I: right, obtuse, acute, straight.
    { id: 'sg2b-7a', type: 'angle-classify', source: 'SG2 Part II #7a',
      prompt: 'Classify this angle.',
      figure: { shape: 'rays', rays: [{ deg: 90 }, { deg: 180 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('right angle'),
      verify: function (a) { return a.value === classify(90); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'right angle' } }
      ] },

    { id: 'sg2b-7b', type: 'angle-classify', source: 'SG2 Part II #7b',
      prompt: 'Classify this angle.',
      figure: { shape: 'rays', rays: [{ deg: 15 }, { deg: 155 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('obtuse angle'),
      verify: function (a) { return a.value === classify(140); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'obtuse angle' } }
      ] },

    { id: 'sg2b-7c', type: 'angle-classify', source: 'SG2 Part II #7c',
      prompt: 'Classify this angle.',
      figure: { shape: 'rays', rays: [{ deg: 20 }, { deg: 70 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('acute angle'),
      verify: function (a) { return a.value === classify(50); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'acute angle' } }
      ] },

    { id: 'sg2b-7d', type: 'angle-classify', source: 'SG2 Part II #7d',
      prompt: 'Classify this angle.',
      figure: { shape: 'rays', rays: [{ deg: 15 }, { deg: 195 }],
                arcs: [{ from: 0, to: 1 }] },
      answer: blankSpec('straight angle'),
      verify: function (a) { return a.value === classify(180); },
      steps: [
        { say: 'Compare it with 90° and 180°, then name it:',
          template: '{a}', blanks: { a: 'straight angle' } }
      ] },

    // ---- Part II #8.  Triangle YXW ≅ triangle HFG. As in Part I the
    // correspondence comes off the tick marks, and as in Part I the worksheet
    // agrees: Y↔H, X↔F, W↔G.
    { id: 'sg2b-8', type: 'congruence', source: 'SG2 Part II #8',
      prompt: 'Using the congruent triangles below, write the 6 congruency statements — one for each pair of congruent angles and each pair of congruent sides.',
      figure: { shape: 'triangles', left: ['Y', 'X', 'W'], right: ['H', 'F', 'G'] },
      answer: blankSpec('FG'),
      verify: function (a) {
        var map = { Y: 'H', X: 'F', W: 'G' };
        return String(a.value) === map.X + map.W;
      },
      steps: [
        { say: 'The matching marks pair the vertices. Start with the angles:',
          template: '∠Y ≅ {a}', blanks: { a: '∠H' } },
        { say: 'The second pair of angles:',
          template: '∠X ≅ {b}', blanks: { b: '∠F' } },
        { say: 'The third pair of angles:',
          template: '∠W ≅ {c}', blanks: { c: '∠G' } },
        { say: 'Now the sides. Each side is named by its two endpoints, so use the same pairing:',
          template: 'YX ≅ {d}', blanks: { d: 'HF' } },
        { say: 'The second pair of sides:',
          template: 'YW ≅ {e}', blanks: { e: 'HG' } },
        { say: 'The third pair of sides:',
          template: 'XW ≅ {f}', blanks: { f: 'FG' } }
      ] },

    // ---- Part II #9.  m∠MLG = 60°, m∠MLK = 148°. Ray LG is inside ∠MLK.
    { id: 'sg2b-9', type: 'angle-addition', source: 'SG2 Part II #9',
      prompt: 'm∠MLG = 60° and m∠MLK = 148°. Find m∠GLK.',
      figure: { shape: 'rays', vertex: 'L',
                rays: [{ deg: 250, label: 'M' }, { deg: 310, label: 'G' },
                       { deg: 398, label: 'K' }],
                arcs: [{ from: 0, to: 1, label: '60°' },
                       { from: 1, to: 2, label: 'x' }] },
      answer: { kind: 'int', value: 88 },
      verify: function (x) { return 60 + x === 148; },
      steps: [
        { say: 'Ray LG is inside ∠MLK, so the two small angles add to the big one:',
          template: 'm∠MLG + m∠GLK = m∠MLK', blanks: {} },
        { say: 'Substitute the two measures you were given:',
          template: '60 + m∠GLK = {a}', blanks: { a: 148 } },
        { say: 'Subtract 60 from both sides:',
          template: 'm∠GLK = {b}', blanks: { opL: '-60', opR: '-60', b: 88 } }
      ] },

    // ---- Part II #10.  m∠PQU = 3x + 4, m∠UQR = 10x − 8, m∠PQR = 113°.
    { id: 'sg2b-10', type: 'angle-addition', source: 'SG2 Part II #10',
      prompt: 'Find x if m∠PQU = 3x + 4, m∠UQR = 10x − 8, and m∠PQR = 113°.',
      figure: { shape: 'rays', vertex: 'Q',
                rays: [{ deg: 265, label: 'P' }, { deg: 296, label: 'U' },
                       { deg: 378, label: 'R' }],
                arcs: [{ from: 0, to: 1, label: '3x + 4' },
                       { from: 1, to: 2, label: '10x − 8' }] },
      answer: { kind: 'int', value: 9 },
      verify: function (x) { return (3 * x + 4) + (10 * x - 8) === 113; },
      steps: [
        { say: 'Ray QU is inside ∠PQR, so the two small angles add to the big one:',
          template: 'm∠PQU + m∠UQR = m∠PQR', blanks: {} },
        { say: 'Substitute the expressions and combine like terms:',
          template: '{a}x − {b} = 113', blanks: { a: 13, b: 4 } },
        { say: 'Add 4 to both sides:',
          template: '13x = {c}', blanks: { opL: '+4', opR: '+4', c: 117 } },
        { say: 'Divide both sides by 13:',
          template: 'x = {d}', blanks: { opL: '÷13', opR: '÷13', d: 9 } }
      ] },

    // ---- Part II #11a.  THE NEW DIRECTION: the whole angle is given and a
    // half is what is asked for. Part I only ever gave a half. Answering 78
    // here -- copying the whole across -- is the mistake this sets up.
    { id: 'sg2b-11a', type: 'bisector', source: 'SG2 Part II #11a',
      prompt: 'EP bisects ∠GEF and m∠GEF = 78°. Find m∠1.',
      figure: { shape: 'rays', vertex: 'E',
                rays: [{ deg: 62, label: 'F' }, { deg: 31, label: 'P' },
                       { deg: 0, label: 'G' }],
                arcs: [{ from: 0, to: 1, label: '2' },
                       { from: 1, to: 2, label: '1' }], bisected: true },
      ask: 'half',
      answer: { kind: 'int', value: 39 },
      verify: function (v) { return v * 2 === 78; },
      steps: [
        { say: 'A bisector cuts the angle into two equal halves. You were given the WHOLE angle this time, so halve it:',
          template: 'm∠1 = 78 ÷ 2 = {a}', blanks: { a: 39 } }
      ] },

    // ---- Part II #11b.  The Part I direction again: one half given, the
    // other half asked for.
    { id: 'sg2b-11b', type: 'bisector', source: 'SG2 Part II #11b',
      prompt: 'CP bisects the angle at C and m∠1 = 36°. Find m∠2.',
      figure: { shape: 'rays', vertex: 'C',
                rays: [{ deg: 300, label: 'B' }, { deg: 336, label: 'P' },
                       { deg: 372, label: 'A' }],
                arcs: [{ from: 0, to: 1, label: '2' },
                       { from: 1, to: 2, label: '1' }], bisected: true },
      ask: 'other-half',
      answer: { kind: 'int', value: 36 },
      verify: function (v) { return v === 36; },
      steps: [
        { say: 'The two halves a bisector makes are equal, so ∠2 measures the same as ∠1. No doubling and no halving here:',
          template: 'm∠2 = {a}', blanks: { a: 36 } }
      ] }
  ];

  globalThis.PROBLEMS = PROBLEMS;
  globalThis.walkProblem = walkProblem;
  globalThis.verifyArg = verifyArg;
  globalThis.classifyAngle = classify;
})();
