// Per-topic mastery streaks and cross-session trouble spots.
// Pure: takes and returns plain objects, never touches localStorage itself.
(function () {
  var VERSION = 1;
  var STORAGE_KEY = 'study-time.geometry-10-t2.progress';

  function empty() { return { version: VERSION, mastery: {}, misses: {} }; }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !(v instanceof Array);
  }

  // Anything unexpected yields a fresh record. A study tool losing history is
  // a nuisance; a study tool refusing to start is a broken evening.
  function parseProgress(json) {
    if (!json) return empty();
    var data;
    try { data = JSON.parse(json); } catch (e) { return empty(); }
    if (!isPlainObject(data)) return empty();
    if (data.version !== VERSION) return empty();
    return {
      version: VERSION,
      mastery: isPlainObject(data.mastery) ? data.mastery : {},
      misses: isPlainObject(data.misses) ? data.misses : {}
    };
  }

  function copy(obj) {
    var out = {};
    for (var k in obj) { if (obj.hasOwnProperty(k)) out[k] = obj[k]; }
    return out;
  }

  function recordResult(progress, type, problemId, firstTryCorrect) {
    var mastery = copy(progress.mastery);
    var misses = copy(progress.misses);
    if (firstTryCorrect) {
      mastery[type] = (mastery[type] || 0) + 1;
    } else {
      mastery[type] = 0;
      misses[type] = (misses[type] || 0) + 1;
    }
    return { version: VERSION, mastery: mastery, misses: misses };
  }

  function masteryStreak(progress, type) { return progress.mastery[type] || 0; }

  function troubleSpots(progress) {
    var out = [];
    for (var type in progress.misses) {
      if (progress.misses.hasOwnProperty(type) && progress.misses[type] > 0) {
        out.push({ type: type, misses: progress.misses[type] });
      }
    }
    out.sort(function (a, b) {
      return b.misses - a.misses || (a.type < b.type ? -1 : 1);
    });
    return out;
  }

  function serializeProgress(progress) { return JSON.stringify(progress); }

  globalThis.STORAGE_KEY = STORAGE_KEY;
  globalThis.parseProgress = parseProgress;
  globalThis.recordResult = recordResult;
  globalThis.masteryStreak = masteryStreak;
  globalThis.troubleSpots = troubleSpots;
  globalThis.serializeProgress = serializeProgress;
})();
