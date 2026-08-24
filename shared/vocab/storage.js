// Best score per mode and a per-word miss tally, kept in localStorage by the
// caller. Pure: takes and returns plain objects, never touches the browser.
(function () {
  var VERSION = 1;

  function storageKey(subject) {
    return 'study-time.' + subject.id + '.progress';
  }

  function emptyProgress() {
    return { version: VERSION, best: {}, misses: {} };
  }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !(v instanceof Array);
  }

  // Anything unexpected yields a fresh record. A study tool losing history is
  // a nuisance; a study tool refusing to start is a broken evening.
  function parseProgress(json) {
    if (!json) return emptyProgress();
    var data;
    try { data = JSON.parse(json); } catch (e) { return emptyProgress(); }
    if (!isPlainObject(data)) return emptyProgress();
    if (data.version !== VERSION) return emptyProgress();
    return {
      version: VERSION,
      best: isPlainObject(data.best) ? data.best : {},
      misses: isPlainObject(data.misses) ? data.misses : {}
    };
  }

  function copy(obj) {
    var out = {};
    for (var k in obj) { if (obj.hasOwnProperty(k)) out[k] = obj[k]; }
    return out;
  }

  // Words are tallied by their side A string. An index would shift the first
  // time the word list is edited, and a tally pointing at the wrong word is
  // worse than no tally at all.
  function recordRound(progress, subject, mode, summary) {
    var best = copy(progress.best);
    var misses = copy(progress.misses);
    if (!best.hasOwnProperty(mode) || summary.clean > best[mode]) {
      best[mode] = summary.clean;
    }
    for (var i = 0; i < summary.unclean.length; i++) {
      var text = subject.pairs[summary.unclean[i]].a;
      misses[text] = (misses[text] || 0) + 1;
    }
    return { version: VERSION, best: best, misses: misses };
  }

  function bestScore(progress, mode) { return progress.best[mode] || 0; }

  function troubleSpots(progress) {
    var out = [];
    for (var text in progress.misses) {
      if (progress.misses.hasOwnProperty(text) && progress.misses[text] > 0) {
        out.push({ text: text, misses: progress.misses[text] });
      }
    }
    out.sort(function (a, b) {
      return b.misses - a.misses || (a.text < b.text ? -1 : 1);
    });
    return out;
  }

  function serializeProgress(progress) { return JSON.stringify(progress); }

  globalThis.storageKey = storageKey;
  globalThis.emptyProgress = emptyProgress;
  globalThis.parseProgress = parseProgress;
  globalThis.recordRound = recordRound;
  globalThis.bestScore = bestScore;
  globalThis.troubleSpots = troubleSpots;
  globalThis.serializeProgress = serializeProgress;
})();
