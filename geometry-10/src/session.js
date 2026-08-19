// Drill and mock-test sequencing. Owns attempt counting and scoring.
// No DOM access.
(function () {
  var MASTERY_TARGET = 4;

  // Proportioned like the study guides. The real Test #1 has not been seen.
  var MOCK_MIX = [
    { type: 'plane', count: 1 },
    { type: 'signs', count: 1 },
    { type: 'intercepts', count: 2 },
    { type: 'equation', count: 6 },
    { type: 'evaluate', count: 2 },
    { type: 'fraction', count: 2 },
    { type: 'radical-calc', count: 2 },
    { type: 'radical-exact', count: 2 },
    { type: 'exponent', count: 2 }
  ];

  function blankNames(step) { return Object.keys(step.blanks); }

  // Display-only steps carry no blanks and are skipped when advancing.
  function firstAnswerable(problem, from) {
    for (var i = from; i < problem.steps.length; i++) {
      if (blankNames(problem.steps[i]).length > 0) return i;
    }
    return -1;
  }

  function createSession(config) {
    var queue = config.queue;          // array of problem objects
    var isDrill = config.isDrill;
    var type = config.type;
    var nextProblem = config.nextProblem;  // function or null

    var problem = null, stepIndex = -1, blankIdx = 0;
    var attempts = 0, revealed = false;
    var cleanProblem = true;
    var streak = 0, solved = 0, score = 0;
    var missed = [];
    var results = [];
    var done = false;

    // A problem whose every step is display-only has nothing to ask, so it is
    // skipped rather than finished -- it must not reach results(). The cap
    // keeps a generator that only ever yields such problems from spinning
    // forever; it surfaces as a finished session instead of a hang.
    function loadNext() {
      for (var tries = 0; tries < 50; tries++) {
        var p = queue.length ? queue.shift() : (nextProblem ? nextProblem() : null);
        if (!p) { done = true; problem = null; return; }
        problem = p;
        stepIndex = firstAnswerable(p, 0);
        blankIdx = 0; attempts = 0; revealed = false; cleanProblem = true;
        if (stepIndex !== -1) return;
      }
      done = true; problem = null;
    }

    function currentStep() { return problem.steps[stepIndex]; }
    function currentBlank() { return blankNames(currentStep())[blankIdx]; }

    function finishProblem() {
      solved += 1;
      results.push({ type: problem.type, problemId: problem.id, clean: cleanProblem });
      if (cleanProblem) { score += 1; streak += 1; } else { streak = 0; }
      if (isDrill && streak >= MASTERY_TARGET) { done = true; problem = null; return; }
      loadNext();
    }

    function advanceBlank() {
      attempts = 0; revealed = false;
      var names = blankNames(currentStep());
      if (blankIdx + 1 < names.length) { blankIdx += 1; return; }
      var next = firstAnswerable(problem, stepIndex + 1);
      if (next === -1) { finishProblem(); return; }
      stepIndex = next; blankIdx = 0;
    }

    function submit(text) {
      if (done || problem === null) {
        return { status: 'done', hint: '', revealed: false, advanced: false, complete: true };
      }
      var step = currentStep();
      var name = currentBlank();
      var spec = blankSpec(step.blanks[name]);
      var result = checkAnswer(text, spec);

      // Neither of these is a real attempt: the first has the right value and
      // the second has no value at all.
      if (result.status === 'unreduced' || result.status === 'malformed') {
        return { status: result.status, hint: '', revealed: false,
                 advanced: false, complete: false };
      }

      if (result.status === 'correct') {
        advanceBlank();
        return { status: 'correct', hint: '', revealed: false,
                 advanced: true, complete: done };
      }

      attempts += 1;
      cleanProblem = false;
      if (attempts === 1) {
        var hint = hintFor({ problem: problem, step: step,
                             blankName: name, typed: text });
        return { status: 'wrong', hint: hint, revealed: false,
                 advanced: false, complete: false };
      }
      var shown = String(step.blanks[name]);
      missed.push({ problem: problem, blankName: name });
      advanceBlank();
      return { status: 'revealed', hint: 'The answer is ' + shown + '.',
               revealed: true, advanced: true, complete: done };
    }

    function current() {
      if (done || problem === null) return null;
      return { problem: problem, stepIndex: stepIndex,
               blankName: currentBlank(), revealed: revealed };
    }

    function progressText() {
      if (isDrill) {
        return 'Problem ' + (solved + 1) + ' · streak ' + streak +
               ' of ' + MASTERY_TARGET;
      }
      return 'Question ' + Math.min(solved + 1, config.total) +
             ' of ' + config.total;
    }

    loadNext();

    return {
      current: current, submit: submit, progressText: progressText,
      isDone: function () { return done; },
      score: function () { return score; },
      missed: function () { return missed.slice(); },
      results: function () { return results.slice(); },
      type: function () { return type; }
    };
  }

  function createDrill(type, options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9));
    var authored = opts.problems || PROBLEMS.filter(function (p) {
      return p.type === type;
    });
    // Authored problems first, then generated variants forever, so repeated
    // drilling cannot decay into memorising the study guide.
    return createSession({
      queue: authored.slice(), isDrill: true, type: type,
      nextProblem: function () { return generate(type, rng); }
    });
  }

  function createMockTest(options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9));
    var queue = [];
    for (var i = 0; i < MOCK_MIX.length; i++) {
      for (var n = 0; n < MOCK_MIX[i].count; n++) {
        queue.push(generate(MOCK_MIX[i].type, rng));
      }
    }
    return createSession({
      queue: queue, isDrill: false, type: 'mixed',
      nextProblem: null, total: queue.length
    });
  }

  globalThis.MASTERY_TARGET = MASTERY_TARGET;
  globalThis.MOCK_MIX = MOCK_MIX;
  globalThis.createDrill = createDrill;
  globalThis.createMockTest = createMockTest;
})();
