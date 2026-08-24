load('tests/helpers.js');
load('tests/fixture.js');
load('storage.js');

// --- the key is derived from the subject, never hardcoded
check('key comes from the subject id', storageKey(FIXTURE),
      'study-time.fixture-1.progress');

// --- a fresh record
var fresh = emptyProgress();
check('fresh record has a version', fresh.version, 1);
check('fresh record has no best scores', Object.keys(fresh.best).length, 0);

// --- anything unreadable yields a fresh record rather than an error.
// Losing history is a nuisance; refusing to start is a broken evening.
check('null parses to empty', parseProgress(null).version, 1);
check('garbage parses to empty', parseProgress('{not json').version, 1);
check('an array parses to empty', parseProgress('[1,2]').version, 1);
check('a wrong version parses to empty',
      Object.keys(parseProgress('{"version":99,"best":{"x":5}}').best).length, 0);
check('a good record round-trips',
      parseProgress(serializeProgress({ version: 1, best: { 'a-to-b': 4 },
                                        misses: {} })).best['a-to-b'], 4);

// --- recording a round keeps the best score and tallies missed words
var summary = { total: 6, clean: 4, second: [0], missed: [1], unclean: [0, 1] };
var p1 = recordRound(emptyProgress(), FIXTURE, 'a-to-b', summary);
check('best score recorded', bestScore(p1, 'a-to-b'), 4);
check('other mode untouched', bestScore(p1, 'b-to-a'), 0);
check('second-try word tallied', p1.misses['a1'], 1);
check('missed word tallied', p1.misses['a2'], 1);
check('clean words are not tallied', p1.misses.hasOwnProperty('a3'), false);

// --- a worse round does not lower the best score, but still tallies
var worse = { total: 6, clean: 1, second: [], missed: [1], unclean: [1] };
var p2 = recordRound(p1, FIXTURE, 'a-to-b', worse);
check('a worse round keeps the best score', bestScore(p2, 'a-to-b'), 4);
check('misses accumulate', p2.misses['a2'], 2);

// --- a better round raises it
var better = { total: 6, clean: 6, second: [], missed: [], unclean: [] };
check('a better round raises the best score',
      bestScore(recordRound(p2, FIXTURE, 'a-to-b', better), 'a-to-b'), 6);

// --- recording does not mutate the record it was given
check('recordRound does not mutate its input', p1.misses['a2'], 1);

// --- trouble spots, worst first, ties alphabetical
var spots = troubleSpots(p2);
check('worst word first', spots[0].text, 'a2');
check('worst word count', spots[0].misses, 2);
check('all missed words listed', spots.length, 2);
check('no trouble spots in a fresh record', troubleSpots(emptyProgress()).length, 0);

done('storage');
