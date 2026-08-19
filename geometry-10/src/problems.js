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
    if (keys.length !== 1) {
      return { ok: false, error: 'final step must have exactly one blank, has ' + keys.length };
    }
    var final = last.blanks[keys[0]];
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
        { say: 'Add 1 to both sides:', template: '−9p = {a}', blanks: { a: -144 } },
        { say: 'Divide both sides by −9:', template: 'p = {b}', blanks: { b: 16 } }
      ] },

    { id: 'p1-5', type: 'equation', source: 'P1 #5', prompt: '−10 + x/14 = −11',
      answer: { kind: 'int', value: -14 },
      verify: function (x) { return -10 + x / 14 === -11; },
      steps: [
        { say: 'Add 10 to both sides:', template: 'x/14 = {a}', blanks: { a: -1 } },
        { say: 'Multiply both sides by 14:', template: 'x = {b}', blanks: { b: -14 } }
      ] },

    { id: 'p1-6', type: 'equation', source: 'P1 #6', prompt: '−(x − 5) = −7',
      answer: { kind: 'int', value: 12 },
      verify: function (x) { return -(x - 5) === -7; },
      steps: [
        { say: 'Distribute the −1:', template: '−x + {a} = −7', blanks: { a: 5 } },
        { say: 'Subtract 5 from both sides:', template: '−x = {b}', blanks: { b: -12 } },
        { say: 'Divide both sides by −1:', template: 'x = {c}', blanks: { c: 12 } }
      ] },

    { id: 'p1-7', type: 'equation', source: 'P1 #7', prompt: '2(n − 7) = −14',
      answer: { kind: 'int', value: 0 },
      verify: function (n) { return 2 * (n - 7) === -14; },
      steps: [
        { say: 'Distribute the 2:', template: '2n − {a} = −14', blanks: { a: 14 } },
        { say: 'Add 14 to both sides:', template: '2n = {b}', blanks: { b: 0 } },
        { say: 'Divide both sides by 2:', template: 'n = {c}', blanks: { c: 0 } }
      ] },

    { id: 'p1-8', type: 'equation', source: 'P1 #8', prompt: '2n + 3 = −4 + 9n',
      answer: { kind: 'int', value: 1 },
      verify: function (n) { return 2 * n + 3 === -4 + 9 * n; },
      steps: [
        { say: 'Subtract 9n from both sides:', template: '{a}n + 3 = −4', blanks: { a: -7 } },
        { say: 'Subtract 3 from both sides:', template: '−7n = {b}', blanks: { b: -7 } },
        { say: 'Divide both sides by −7:', template: 'n = {c}', blanks: { c: 1 } }
      ] },

    { id: 'p1-9', type: 'equation', source: 'P1 #9', prompt: '1 − 7a = −5 − 8a',
      answer: { kind: 'int', value: -6 },
      verify: function (a) { return 1 - 7 * a === -5 - 8 * a; },
      steps: [
        { say: 'Add 8a to both sides:', template: '1 + {a}a = −5', blanks: { a: 1 } },
        { say: 'Subtract 1 from both sides:', template: 'a = {b}', blanks: { b: -6 } }
      ] },

    { id: 'p2-2', type: 'equation', source: 'P2 #2', prompt: '4n + 5 = −55',
      answer: { kind: 'int', value: -15 },
      verify: function (n) { return 4 * n + 5 === -55; },
      steps: [
        { say: 'Subtract 5 from both sides:', template: '4n = {a}', blanks: { a: -60 } },
        { say: 'Divide both sides by 4:', template: 'n = {b}', blanks: { b: -15 } }
      ] },

    { id: 'p2-3', type: 'equation', source: 'P2 #3', prompt: '−1 − 7b = 83',
      answer: { kind: 'int', value: -12 },
      verify: function (b) { return -1 - 7 * b === 83; },
      steps: [
        { say: 'Add 1 to both sides:', template: '−7b = {a}', blanks: { a: 84 } },
        { say: 'Divide both sides by −7:', template: 'b = {b}', blanks: { b: -12 } }
      ] },

    { id: 'p2-4', type: 'equation', source: 'P2 #4', prompt: '1 + b/4 = −1',
      answer: { kind: 'int', value: -8 },
      verify: function (b) { return 1 + b / 4 === -1; },
      steps: [
        { say: 'Subtract 1 from both sides:', template: 'b/4 = {a}', blanks: { a: -2 } },
        { say: 'Multiply both sides by 4:', template: 'b = {b}', blanks: { b: -8 } }
      ] },

    { id: 'p2-5', type: 'equation', source: 'P2 #5', prompt: 'm/5 − 6 = −3',
      answer: { kind: 'int', value: 15 },
      verify: function (m) { return m / 5 - 6 === -3; },
      steps: [
        { say: 'Add 6 to both sides:', template: 'm/5 = {a}', blanks: { a: 3 } },
        { say: 'Multiply both sides by 5:', template: 'm = {b}', blanks: { b: 15 } }
      ] },

    { id: 'p2-6', type: 'equation', source: 'P2 #6', prompt: '6(−8n − 1) = −294',
      answer: { kind: 'int', value: 6 },
      verify: function (n) { return 6 * (-8 * n - 1) === -294; },
      steps: [
        { say: 'Distribute the 6:', template: '{a}n − 6 = −294', blanks: { a: -48 } },
        { say: 'Add 6 to both sides:', template: '−48n = {b}', blanks: { b: -288 } },
        { say: 'Divide both sides by −48:', template: 'n = {c}', blanks: { c: 6 } }
      ] },

    { id: 'p2-7', type: 'equation', source: 'P2 #7', prompt: '−7(6 − 3n) = −84',
      answer: { kind: 'int', value: -2 },
      verify: function (n) { return -7 * (6 - 3 * n) === -84; },
      steps: [
        { say: 'Distribute the −7:', template: '−42 + {a}n = −84', blanks: { a: 21 } },
        { say: 'Add 42 to both sides:', template: '21n = {b}', blanks: { b: -42 } },
        { say: 'Divide both sides by 21:', template: 'n = {c}', blanks: { c: -2 } }
      ] },

    { id: 'p2-8', type: 'equation', source: 'P2 #8', prompt: '3p − 7 = 4p − 2',
      answer: { kind: 'int', value: -5 },
      verify: function (p) { return 3 * p - 7 === 4 * p - 2; },
      steps: [
        { say: 'Subtract 4p from both sides:', template: '{a}p − 7 = −2', blanks: { a: -1 } },
        { say: 'Add 7 to both sides:', template: '−p = {b}', blanks: { b: 5 } },
        { say: 'Divide both sides by −1:', template: 'p = {c}', blanks: { c: -5 } }
      ] },

    // The student subtracted 2x here instead of adding it, and got x = −2.
    { id: 'p2-9', type: 'equation', source: 'P2 #9', prompt: 'x + 7 = −2x + 7',
      answer: { kind: 'int', value: 0 },
      verify: function (x) { return x + 7 === -2 * x + 7; },
      steps: [
        { say: 'Add 2x to both sides:', template: '{a}x + 7 = 7', blanks: { a: 3 } },
        { say: 'Subtract 7 from both sides:', template: '3x = {b}', blanks: { b: 0 } },
        { say: 'Divide both sides by 3:', template: 'x = {c}', blanks: { c: 0 } }
      ] }
  ];

  globalThis.PROBLEMS = PROBLEMS;
  globalThis.walkProblem = walkProblem;
  globalThis.verifyArg = verifyArg;
})();
