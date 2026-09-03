load('tests/helpers.js');
load('src/storage.js');

// --- parsing is defensive: bad input never throws
check('null', parseProgress(null).version, 1);
check('empty', parseProgress('').version, 1);
check('corrupt', parseProgress('{not json').version, 1);
check('array', parseProgress('[1,2,3]').version, 1);
check('wrong version', Object.keys(parseProgress('{"version":99,"mastery":{"a":9}}').mastery).length, 0);
check('good', parseProgress('{"version":1,"mastery":{"equation":2},"misses":{}}').mastery.equation, 2);

// --- streaks build and reset
var p = parseProgress(null);
check('empty streak', masteryStreak(p, 'bisector'), 0);
p = recordResult(p, 'bisector', 'sg2-3', true);
p = recordResult(p, 'bisector', 'sg2-4', true);
check('streak of two', masteryStreak(p, 'bisector'), 2);
p = recordResult(p, 'bisector', 'sg2-5', false);
check('miss resets streak', masteryStreak(p, 'bisector'), 0);
p = recordResult(p, 'bisector', 'sg2-6', true);
check('streak restarts', masteryStreak(p, 'bisector'), 1);

// --- streaks are per type, not global
var q = parseProgress(null);
q = recordResult(q, 'bisector', 'a', true);
q = recordResult(q, 'midpoint', 'b', false);
check('other type untouched', masteryStreak(q, 'bisector'), 1);
check('missed type is zero', masteryStreak(q, 'midpoint'), 0);

// --- recordResult must not mutate its input
var before = parseProgress(null);
before = recordResult(before, 'bisector', 'a', true);
var snapshot = masteryStreak(before, 'bisector');
recordResult(before, 'bisector', 'b', true);
check('no mutation', masteryStreak(before, 'bisector'), snapshot);

// --- trouble spots rank by miss count
var t = parseProgress(null);
t = recordResult(t, 'midpoint', 'a', false);
t = recordResult(t, 'midpoint', 'b', false);
t = recordResult(t, 'bisector', 'c', false);
t = recordResult(t, 'distance', 'd', true);
var spots = troubleSpots(t);
check('two types missed', spots.length, 2);
check('worst first', spots[0].type, 'midpoint');
check('worst count', spots[0].misses, 2);
check('mastered type absent', spots.filter(function (s) {
  return s.type === 'distance'; }).length, 0);

// --- a serialize/parse round trip preserves everything
var round = parseProgress(serializeProgress(t));
check('round trip misses', round.misses.midpoint, 2);
check('round trip mastery', masteryStreak(round, 'bisector'), 0);


// --- the storage key must NOT be Test #1's, or the two tools overwrite each
// other's mastery bars and trouble spots.
check('own storage key', STORAGE_KEY, 'study-time.geometry-10-t2.progress');

done('storage');
