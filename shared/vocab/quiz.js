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

  globalThis.OPTION_COUNT = OPTION_COUNT;
  globalThis.MODE_A_TO_B = MODE_A_TO_B;
  globalThis.MODE_B_TO_A = MODE_B_TO_A;
  globalThis.makeRng = makeRng;
  globalThis.shuffle = shuffle;
  globalThis.sideKeys = sideKeys;
  globalThis.buildQuestion = buildQuestion;
  globalThis.noteFor = noteFor;
})();
