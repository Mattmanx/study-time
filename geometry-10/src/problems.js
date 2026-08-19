// The study guide problems, as data. Every answer here is verified against
// the teacher's answer keys -- do not "fix" one against your own arithmetic
// without re-reading the key PDFs in reference/.
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

  // int and decimal2 answers verify against a bare number; every other kind
  // needs the whole spec, since its value lives in several fields.
  function verifyArg(answer) {
    return (answer.kind === 'int' || answer.kind === 'decimal2') ? answer.value : answer;
  }

  var PROBLEMS = [
    // ---- Type 4: multi-step linear equations (Part I #4-9, Part II #2-9)
    { id: 'p1-4', type: 'equation', source: 'P1 #4', prompt: '−9p − 1 = −145',
      answer: { kind: 'int', value: 16 },
      verify: function (p) { return -9 * p - 1 === -145; },
      steps: [
        { say: 'Add 1 to both sides:', template: '−9p = {a}', blanks: { opL: '+1', opR: '+1', a: -144 } },
        { say: 'Divide both sides by −9:', template: 'p = {b}', blanks: { opL: '÷-9', opR: '÷-9', b: 16 } }
      ] },

    { id: 'p1-5', type: 'equation', source: 'P1 #5', prompt: '−10 + x/14 = −11',
      answer: { kind: 'int', value: -14 },
      verify: function (x) { return -10 + x / 14 === -11; },
      steps: [
        { say: 'Add 10 to both sides:', template: 'x/14 = {a}', blanks: { opL: '+10', opR: '+10', a: -1 } },
        { say: 'Multiply both sides by 14:', template: 'x = {b}', blanks: { opL: '×14', opR: '×14', b: -14 } }
      ] },

    { id: 'p1-6', type: 'equation', source: 'P1 #6', prompt: '−(x − 5) = −7',
      answer: { kind: 'int', value: 12 },
      verify: function (x) { return -(x - 5) === -7; },
      steps: [
        { say: 'Distribute the −1:', template: '−x + {a} = −7', blanks: { a: 5 } },
        { say: 'Subtract 5 from both sides:', template: '−x = {b}', blanks: { opL: '-5', opR: '-5', b: -12 } },
        { say: 'Divide both sides by −1:', template: 'x = {c}', blanks: { opL: '÷-1', opR: '÷-1', c: 12 } }
      ] },

    { id: 'p1-7', type: 'equation', source: 'P1 #7', prompt: '2(n − 7) = −14',
      answer: { kind: 'int', value: 0 },
      verify: function (n) { return 2 * (n - 7) === -14; },
      steps: [
        { say: 'Distribute the 2:', template: '2n − {a} = −14', blanks: { a: 14 } },
        { say: 'Add 14 to both sides:', template: '2n = {b}', blanks: { opL: '+14', opR: '+14', b: 0 } },
        { say: 'Divide both sides by 2:', template: 'n = {c}', blanks: { opL: '÷2', opR: '÷2', c: 0 } }
      ] },

    { id: 'p1-8', type: 'equation', source: 'P1 #8', prompt: '2n + 3 = −4 + 9n',
      answer: { kind: 'int', value: 1 },
      verify: function (n) { return 2 * n + 3 === -4 + 9 * n; },
      steps: [
        { say: 'Subtract 9n from both sides:', template: '{a}n + 3 = −4', blanks: { opL: '-9n', opR: '-9n', a: -7 } },
        { say: 'Subtract 3 from both sides:', template: '−7n = {b}', blanks: { opL: '-3', opR: '-3', b: -7 } },
        { say: 'Divide both sides by −7:', template: 'n = {c}', blanks: { opL: '÷-7', opR: '÷-7', c: 1 } }
      ] },

    { id: 'p1-9', type: 'equation', source: 'P1 #9', prompt: '1 − 7a = −5 − 8a',
      answer: { kind: 'int', value: -6 },
      verify: function (a) { return 1 - 7 * a === -5 - 8 * a; },
      steps: [
        { say: 'Add 8a to both sides:', template: '1 + {a}a = −5', blanks: { opL: '+8a', opR: '+8a', a: 1 } },
        { say: 'Subtract 1 from both sides:', template: 'a = {b}', blanks: { opL: '-1', opR: '-1', b: -6 } }
      ] },

    { id: 'p2-2', type: 'equation', source: 'P2 #2', prompt: '4n + 5 = −55',
      answer: { kind: 'int', value: -15 },
      verify: function (n) { return 4 * n + 5 === -55; },
      steps: [
        { say: 'Subtract 5 from both sides:', template: '4n = {a}', blanks: { opL: '-5', opR: '-5', a: -60 } },
        { say: 'Divide both sides by 4:', template: 'n = {b}', blanks: { opL: '÷4', opR: '÷4', b: -15 } }
      ] },

    { id: 'p2-3', type: 'equation', source: 'P2 #3', prompt: '−1 − 7b = 83',
      answer: { kind: 'int', value: -12 },
      verify: function (b) { return -1 - 7 * b === 83; },
      steps: [
        { say: 'Add 1 to both sides:', template: '−7b = {a}', blanks: { opL: '+1', opR: '+1', a: 84 } },
        { say: 'Divide both sides by −7:', template: 'b = {b}', blanks: { opL: '÷-7', opR: '÷-7', b: -12 } }
      ] },

    { id: 'p2-4', type: 'equation', source: 'P2 #4', prompt: '1 + b/4 = −1',
      answer: { kind: 'int', value: -8 },
      verify: function (b) { return 1 + b / 4 === -1; },
      steps: [
        { say: 'Subtract 1 from both sides:', template: 'b/4 = {a}', blanks: { opL: '-1', opR: '-1', a: -2 } },
        { say: 'Multiply both sides by 4:', template: 'b = {b}', blanks: { opL: '×4', opR: '×4', b: -8 } }
      ] },

    { id: 'p2-5', type: 'equation', source: 'P2 #5', prompt: 'm/5 − 6 = −3',
      answer: { kind: 'int', value: 15 },
      verify: function (m) { return m / 5 - 6 === -3; },
      steps: [
        { say: 'Add 6 to both sides:', template: 'm/5 = {a}', blanks: { opL: '+6', opR: '+6', a: 3 } },
        { say: 'Multiply both sides by 5:', template: 'm = {b}', blanks: { opL: '×5', opR: '×5', b: 15 } }
      ] },

    { id: 'p2-6', type: 'equation', source: 'P2 #6', prompt: '6(−8n − 1) = −294',
      answer: { kind: 'int', value: 6 },
      verify: function (n) { return 6 * (-8 * n - 1) === -294; },
      steps: [
        { say: 'Distribute the 6:', template: '{a}n − 6 = −294', blanks: { a: -48 } },
        { say: 'Add 6 to both sides:', template: '−48n = {b}', blanks: { opL: '+6', opR: '+6', b: -288 } },
        { say: 'Divide both sides by −48:', template: 'n = {c}', blanks: { opL: '÷-48', opR: '÷-48', c: 6 } }
      ] },

    { id: 'p2-7', type: 'equation', source: 'P2 #7', prompt: '−7(6 − 3n) = −84',
      answer: { kind: 'int', value: -2 },
      verify: function (n) { return -7 * (6 - 3 * n) === -84; },
      steps: [
        { say: 'Distribute the −7:', template: '−42 + {a}n = −84', blanks: { a: 21 } },
        { say: 'Add 42 to both sides:', template: '21n = {b}', blanks: { opL: '+42', opR: '+42', b: -42 } },
        { say: 'Divide both sides by 21:', template: 'n = {c}', blanks: { opL: '÷21', opR: '÷21', c: -2 } }
      ] },

    { id: 'p2-8', type: 'equation', source: 'P2 #8', prompt: '3p − 7 = 4p − 2',
      answer: { kind: 'int', value: -5 },
      verify: function (p) { return 3 * p - 7 === 4 * p - 2; },
      steps: [
        { say: 'Subtract 4p from both sides:', template: '{a}p − 7 = −2', blanks: { opL: '-4p', opR: '-4p', a: -1 } },
        { say: 'Add 7 to both sides:', template: '−p = {b}', blanks: { opL: '+7', opR: '+7', b: 5 } },
        { say: 'Divide both sides by −1:', template: 'p = {c}', blanks: { opL: '÷-1', opR: '÷-1', c: -5 } }
      ] },

    // The student subtracted 2x here instead of adding it, and got x = −2.
    { id: 'p2-9', type: 'equation', source: 'P2 #9', prompt: 'x + 7 = −2x + 7',
      answer: { kind: 'int', value: 0 },
      verify: function (x) { return x + 7 === -2 * x + 7; },
      steps: [
        { say: 'Add 2x to both sides:', template: '{a}x + 7 = 7', blanks: { opL: '+2x', opR: '+2x', a: 3 } },
        { say: 'Subtract 7 from both sides:', template: '3x = {b}', blanks: { opL: '-7', opR: '-7', b: 0 } },
        { say: 'Divide both sides by 3:', template: 'x = {c}', blanks: { opL: '÷3', opR: '÷3', c: 0 } }
      ] },

    // ---- Type 5: evaluate at given values (Part I #10-11, Part II #10a-b)
    // Both Part I items were missed the same way: subtracting a negative.
    { id: 'p1-10', type: 'evaluate', source: 'P1 #10',
      prompt: 'p − r + p    when p = −8 and r = −7',
      answer: { kind: 'int', value: -9 },
      verify: function (v) { return (-8) - (-7) + (-8) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(−8) − ({a}) + (−8)', blanks: { a: -7 } },
        { say: 'Subtracting a negative is adding. Rewrite it:', template: '−8 + {b} − 8', blanks: { b: 7 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -9 } }
      ] },

    { id: 'p1-11', type: 'evaluate', source: 'P1 #11',
      prompt: 'y + xy − x    when x = −3 and y = 2',
      answer: { kind: 'int', value: -1 },
      verify: function (v) { return 2 + (-3) * 2 - (-3) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(2) + (−3)(2) − ({a})', blanks: { a: -3 } },
        { say: 'Multiply first:', template: '2 + ({b}) − (−3)', blanks: { b: -6 } },
        { say: 'Subtracting a negative is adding. Rewrite it:', template: '2 − 6 + {c}', blanks: { c: 3 } },
        { say: 'Add left to right:', template: '{d}', blanks: { d: -1 } }
      ] },

    { id: 'p2-10a', type: 'evaluate', source: 'P2 #10a',
      prompt: '−5 + z − y    when y = 7 and z = −4',
      answer: { kind: 'int', value: -16 },
      verify: function (v) { return -5 + (-4) - 7 === v; },
      steps: [
        { say: 'Substitute the values:', template: '−5 + ({a}) − (7)', blanks: { a: -4 } },
        { say: 'Drop the parentheses:', template: '−5 − 4 − {b}', blanks: { b: 7 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -16 } }
      ] },

    { id: 'p2-10b', type: 'evaluate', source: 'P2 #10b',
      prompt: 'r + r(m) + m    when r = 10 and m = −8',
      answer: { kind: 'int', value: -78 },
      verify: function (v) { return 10 + 10 * (-8) + (-8) === v; },
      steps: [
        { say: 'Substitute the values:', template: '(10) + (10)({a}) + (−8)', blanks: { a: -8 } },
        { say: 'Multiply first:', template: '10 + ({b}) − 8', blanks: { b: -80 } },
        { say: 'Add left to right:', template: '{c}', blanks: { c: -78 } }
      ] },

    // ---- Type 6: multiply or divide fractions, fully simplified
    { id: 'p1-12', type: 'fraction', source: 'P1 #12', prompt: '18/10 · 15/20',
      answer: { kind: 'fraction', num: 27, den: 20 },
      verify: function (f) { return Math.abs((18 / 10) * (15 / 20) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Cancel 18 and 10 by their common factor 2:', template: '{a}/5 · 15/20', blanks: { a: 9 } },
        { say: 'Cancel 15 and 20 by their common factor 5:', template: '9/5 · 3/{b}', blanks: { b: 4 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '27/20' } }
      ] },

    { id: 'p1-13', type: 'fraction', source: 'P1 #13', prompt: '27/10 ÷ 18/8',
      answer: { kind: 'fraction', num: 6, den: 5 },
      verify: function (f) { return Math.abs((27 / 10) / (18 / 8) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Keep, change, flip — turn the divide into a multiply:', template: '27/10 · {a}/18', blanks: { a: 8 } },
        { say: 'Cancel 27 and 18 by 9, then 8 and 10 by 2, and reduce 4/2:', template: '3/5 · {b}/1', blanks: { b: 2 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '6/5' } }
      ] },

    { id: 'p2-11', type: 'fraction', source: 'P2 #11', prompt: '12/22 ÷ 42/33',
      answer: { kind: 'fraction', num: 3, den: 7 },
      verify: function (f) { return Math.abs((12 / 22) / (42 / 33) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Keep, change, flip — turn the divide into a multiply:', template: '12/22 · {a}/42', blanks: { a: 33 } },
        { say: 'Cancel 12 and 22 by 2, and 33 and 42 by 3:', template: '6/11 · 11/{b}', blanks: { b: 14 } },
        { say: 'Cancel the 11s, then 6 and 14 by 2:', template: '3/1 · 1/{c}', blanks: { c: 7 } },
        { say: 'Multiply across:', template: '{d}', blanks: { d: '3/7' } }
      ] },

    { id: 'p2-12', type: 'fraction', source: 'P2 #12', prompt: '4/18 · 30/35',
      answer: { kind: 'fraction', num: 4, den: 21 },
      verify: function (f) { return Math.abs((4 / 18) * (30 / 35) - f.num / f.den) < 1e-9; },
      steps: [
        { say: 'Cancel 4 and 18 by 2, and 30 and 35 by 5:', template: '2/9 · {a}/7', blanks: { a: 6 } },
        { say: 'Cancel 6 and 9 by their common factor 3:', template: '2/3 · {b}/7', blanks: { b: 2 } },
        { say: 'Multiply across:', template: '{c}', blanks: { c: '4/21' } }
      ] },

    // ---- Type 7: radicals WITH the calculator, rounded to hundredths
    { id: 'p1-14', type: 'radical-calc', source: 'P1 #14', prompt: '√250',
      answer: { kind: 'decimal2', value: 15.81 },
      verify: function (v) { return Math.abs(Math.sqrt(250) - v) < 0.005; },
      steps: [
        { say: 'Round √250 = 15.8113… to the hundredths place:', template: '{a}', blanks: { a: '15.81' } }
      ] },

    { id: 'p1-15', type: 'radical-calc', source: 'P1 #15', prompt: '√58',
      answer: { kind: 'decimal2', value: 7.62 },
      verify: function (v) { return Math.abs(Math.sqrt(58) - v) < 0.005; },
      steps: [
        { say: 'Round √58 = 7.6157… to the hundredths place:', template: '{a}', blanks: { a: '7.62' } }
      ] },

    { id: 'p2-13', type: 'radical-calc', source: 'P2 #13', prompt: '√35',
      answer: { kind: 'decimal2', value: 5.92 },
      verify: function (v) { return Math.abs(Math.sqrt(35) - v) < 0.005; },
      steps: [
        { say: 'Round √35 = 5.9160… to the hundredths place:', template: '{a}', blanks: { a: '5.92' } }
      ] },

    { id: 'p2-14', type: 'radical-calc', source: 'P2 #14', prompt: '√110',
      answer: { kind: 'decimal2', value: 10.49 },
      verify: function (v) { return Math.abs(Math.sqrt(110) - v) < 0.005; },
      steps: [
        { say: 'Round √110 = 10.4880… to the hundredths place:', template: '{a}', blanks: { a: '10.49' } }
      ] },

    // ---- Type 8a: radicals WITHOUT the calculator -- exact answers only
    { id: 'p1-16', type: 'radical-exact', source: 'P1 #16', prompt: '√250',
      answer: { kind: 'radical', coef: 5, rad: 10 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(250)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 250:', template: '√250 = √({a} · 10)', blanks: { a: 25 } },
        { say: 'Take the square root of 25 out front:', template: '{b}√10', blanks: { b: 5 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '5√10' } }
      ] },

    { id: 'p1-17', type: 'radical-exact', source: 'P1 #17', prompt: '√56',
      answer: { kind: 'radical', coef: 2, rad: 14 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(56)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 56:', template: '√56 = √({a} · 14)', blanks: { a: 4 } },
        { say: 'Take the square root of 4 out front:', template: '{b}√14', blanks: { b: 2 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '2√14' } }
      ] },

    { id: 'p2-15', type: 'radical-exact', source: 'P2 #15', prompt: '√84',
      answer: { kind: 'radical', coef: 2, rad: 21 },
      verify: function (a) { return Math.abs(a.coef * Math.sqrt(a.rad) - Math.sqrt(84)) < 1e-9; },
      steps: [
        { say: 'Find the largest perfect square that divides 84:', template: '√84 = √({a} · 21)', blanks: { a: 4 } },
        { say: 'Take the square root of 4 out front:', template: '{b}√21', blanks: { b: 2 } },
        { say: 'Write the complete simplified answer:', template: '{c}', blanks: { c: '2√21' } }
      ] },

    // ---- Type 8b: exponents. The minus sign is inside the parentheses or
    // it is not, and that is the whole question.
    { id: 'p1-18', type: 'exponent', source: 'P1 #18', prompt: '18²',
      answer: { kind: 'int', value: 324 },
      verify: function (v) { return 18 * 18 === v; },
      steps: [
        { say: 'Write it as a product:', template: '18 · 18 = {a}', blanks: { a: 324 } }
      ] },

    { id: 'p1-19', type: 'exponent', source: 'P1 #19', prompt: '(−17)²',
      answer: { kind: 'int', value: 289 },
      verify: function (v) { return (-17) * (-17) === v; },
      steps: [
        { say: 'The −17 is inside the parentheses, so both factors are negative:', template: '(−17) · (−17) = {a}', blanks: { a: 289 } }
      ] },

    { id: 'p1-20', type: 'exponent', source: 'P1 #20', prompt: '−6²',
      answer: { kind: 'int', value: -36 },
      verify: function (v) { return -(6 * 6) === v; },
      steps: [
        { say: 'No parentheses, so only the 6 is squared:', template: '−(6 · 6) = {a}', blanks: { a: -36 } }
      ] },

    { id: 'p2-16', type: 'exponent', source: 'P2 #16', prompt: '9²',
      answer: { kind: 'int', value: 81 },
      verify: function (v) { return 9 * 9 === v; },
      steps: [
        { say: 'Write it as a product:', template: '9 · 9 = {a}', blanks: { a: 81 } }
      ] },

    { id: 'p2-17', type: 'exponent', source: 'P2 #17', prompt: '−15²',
      answer: { kind: 'int', value: -225 },
      verify: function (v) { return -(15 * 15) === v; },
      steps: [
        { say: 'No parentheses, so only the 15 is squared:', template: '−(15 · 15) = {a}', blanks: { a: -225 } }
      ] },

    { id: 'p2-18', type: 'exponent', source: 'P2 #18', prompt: '(−24)²',
      answer: { kind: 'int', value: 576 },
      verify: function (v) { return (-24) * (-24) === v; },
      steps: [
        { say: 'The −24 is inside the parentheses, so both factors are negative:', template: '(−24) · (−24) = {a}', blanks: { a: 576 } }
      ] }
  ];

  globalThis.PROBLEMS = PROBLEMS;
  globalThis.walkProblem = walkProblem;
  globalThis.verifyArg = verifyArg;
})();
