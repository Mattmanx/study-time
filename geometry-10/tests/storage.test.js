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
check('empty streak', masteryStreak(p, 'equation'), 0);
p = recordResult(p, 'equation', 'p1-4', true);
p = recordResult(p, 'equation', 'p1-5', true);
check('streak of two', masteryStreak(p, 'equation'), 2);
p = recordResult(p, 'equation', 'p1-6', false);
check('miss resets streak', masteryStreak(p, 'equation'), 0);
p = recordResult(p, 'equation', 'p1-7', true);
check('streak restarts', masteryStreak(p, 'equation'), 1);

// --- streaks are per type, not global
var q = parseProgress(null);
q = recordResult(q, 'equation', 'a', true);
q = recordResult(q, 'fraction', 'b', false);
check('other type untouched', masteryStreak(q, 'equation'), 1);
check('missed type is zero', masteryStreak(q, 'fraction'), 0);

// --- recordResult must not mutate its input
var before = parseProgress(null);
before = recordResult(before, 'equation', 'a', true);
var snapshot = masteryStreak(before, 'equation');
recordResult(before, 'equation', 'b', true);
check('no mutation', masteryStreak(before, 'equation'), snapshot);

// --- trouble spots rank by miss count
var t = parseProgress(null);
t = recordResult(t, 'fraction', 'a', false);
t = recordResult(t, 'fraction', 'b', false);
t = recordResult(t, 'equation', 'c', false);
t = recordResult(t, 'exponent', 'd', true);
var spots = troubleSpots(t);
check('two types missed', spots.length, 2);
check('worst first', spots[0].type, 'fraction');
check('worst count', spots[0].misses, 2);
check('mastered type absent', spots.filter(function (s) {
  return s.type === 'exponent'; }).length, 0);

// --- a serialize/parse round trip preserves everything
var round = parseProgress(serializeProgress(t));
check('round trip misses', round.misses.fraction, 2);
check('round trip mastery', masteryStreak(round, 'equation'), 0);

done('storage');
