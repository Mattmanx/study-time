// The quiz engine. Subject-agnostic: it knows only side A and side B of a
// pair, and every label the student reads comes from the subject's config.
// No DOM. Every draw takes an injected rng so rounds are reproducible in tests.
(function () {
  var OPTION_COUNT = 4;
  var MODE_A_TO_B = 'a-to-b';
  var MODE_B_TO_A = 'b-to-a';

  // A small linear congruential generator. Deterministic per seed, which is
  // the whole point: a failing round can be replayed exactly.
  function makeRng(seed) {
    var state = (seed >>> 0) || 1;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffle(list, rng) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function sideKeys(mode) {
    return mode === MODE_B_TO_A
      ? { prompt: 'b', answer: 'a' }
      : { prompt: 'a', answer: 'b' };
  }

  // Distractors are drawn from the entire pool, deliberately including near
  // synonyms: telling those apart is what the quiz is actually testing.
  function buildQuestion(subject, mode, pairIndex, rng) {
    var keys = sideKeys(mode);
    var pairs = subject.pairs;
    var answer = pairs[pairIndex][keys.answer];
    var pool = [];
    for (var i = 0; i < pairs.length; i++) {
      if (i !== pairIndex) pool.push(pairs[i][keys.answer]);
    }
    var options = shuffle(pool, rng).slice(0, OPTION_COUNT - 1);
    options.push(answer);
    return {
      pairIndex: pairIndex,
      prompt: pairs[pairIndex][keys.prompt],
      answer: answer,
      options: shuffle(options, rng)
    };
  }

  // Clusters are declared with side A strings, so the lookup is by pair, not
  // by whatever text happens to be on screen in the current mode.
  function noteFor(subject, pairIndex) {
    var clusters = subject.confusables || [];
    var key = subject.pairs[pairIndex].a;
    for (var c = 0; c < clusters.length; c++) {
      var members = clusters[c].members || [];
      for (var m = 0; m < members.length; m++) {
        if (members[m] === key) return clusters[c].note;
      }
    }
    return '';
  }

  // A round of questions. Two rules live here and nowhere else:
  //   main  - two tries, then the answer is revealed and the round moves on
  //   retry - one try; a miss goes to the back of the queue and comes around
  //           again, so the round ends only when every word has been answered
  //           correctly once
  function createRound(subject, mode, options) {
    var opts = options || {};
    var rng = opts.rng || makeRng(Math.floor(Math.random() * 1e9) + 1);
    var isRetry = !!opts.retry;
    var triesAllowed = isRetry ? 1 : 2;

    var items = opts.items ? opts.items.slice() : null;
    if (!items) {
      items = [];
      for (var i = 0; i < subject.pairs.length; i++) items.push(i);
    }
    var queue = shuffle(items, rng);
    var total = queue.length;

    var current = null, tries = 0, done = false;
    var answered = 0, cleared = 0, clean = 0;
    var second = [], missed = [];

    function loadNext() {
      if (!queue.length) { done = true; current = null; return; }
      current = buildQuestion(subject, mode, queue.shift(), rng);
      tries = 0;
    }

    function result(status, chosen, shown, note) {
      return {
        status: status,
        correct: status === 'correct' || status === 'correct-second',
        chosen: chosen,
        answer: shown,
        note: note,
        pairIndex: current ? current.pairIndex : -1,
        complete: false
      };
    }

    function answer(choice) {
      if (done || current === null) {
        return { status: 'done', correct: false, chosen: choice, answer: '',
                 note: '', pairIndex: -1, complete: true };
      }
      var pairIndex = current.pairIndex;

      if (choice === current.answer) {
        var status = tries === 0 ? 'correct' : 'correct-second';
        if (isRetry) {
          cleared += 1;
        } else {
          answered += 1;
          if (tries === 0) { clean += 1; } else { second.push(pairIndex); }
        }
        var ok = result(status, choice, '', '');
        loadNext();
        ok.complete = done;
        return ok;
      }

      tries += 1;
      if (tries < triesAllowed) return result('retry', choice, '', '');

      var shown = current.answer;
      var note = noteFor(subject, pairIndex);
      var out = result('revealed', choice, shown, note);
      if (isRetry) {
        queue.push(pairIndex);   // comes around again on a later pass
      } else {
        answered += 1;
        missed.push(pairIndex);
      }
      loadNext();
      out.complete = done;
      return out;
    }

    function summary() {
      return {
        total: total,
        clean: clean,
        second: second.slice(),
        missed: missed.slice(),
        unclean: second.concat(missed)
      };
    }

    function progressText() {
      if (isRetry) {
        var left = queue.length + (current ? 1 : 0);
        return left === 1 ? '1 word left' : left + ' words left';
      }
      return 'Question ' + Math.min(answered + 1, total) + ' of ' + total;
    }

    loadNext();

    return {
      current: function () { return current; },
      answer: answer,
      summary: summary,
      progressText: progressText,
      isDone: function () { return done; },
      isRetry: function () { return isRetry; },
      mode: function () { return mode; }
    };
  }

  globalThis.OPTION_COUNT = OPTION_COUNT;
  globalThis.MODE_A_TO_B = MODE_A_TO_B;
  globalThis.MODE_B_TO_A = MODE_B_TO_A;
  globalThis.makeRng = makeRng;
  globalThis.shuffle = shuffle;
  globalThis.sideKeys = sideKeys;
  globalThis.buildQuestion = buildQuestion;
  globalThis.noteFor = noteFor;
  globalThis.createRound = createRound;
})();
