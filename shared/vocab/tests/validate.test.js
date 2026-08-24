load('tests/helpers.js');
load('tests/fixture.js');
load('validate.js');

function clone(subject) { return JSON.parse(JSON.stringify(subject)); }
function errs(subject) { return validateSubject(subject).join(' | '); }

// --- a well-formed subject reports nothing
check('fixture is valid', validateSubject(FIXTURE).length, 0);

// --- duplicate strings on either side make a question unanswerable
var dupA = clone(FIXTURE);
dupA.pairs[3].a = 'a1';
check('duplicate side A caught', validateSubject(dupA).length, 1);
check('duplicate side A names the string', errs(dupA).indexOf('a1') >= 0, true);

var dupB = clone(FIXTURE);
dupB.pairs[3].b = 'b1';
check('duplicate side B caught', validateSubject(dupB).length, 1);
check('duplicate side B names the string', errs(dupB).indexOf('b1') >= 0, true);

// --- empty or untrimmed entries
var blank = clone(FIXTURE);
blank.pairs[2].b = '';
check('empty side caught', validateSubject(blank).length, 1);

var spacey = clone(FIXTURE);
spacey.pairs[2].b = ' b3 ';
check('untrimmed side caught', validateSubject(spacey).length, 1);

// --- four options are impossible with fewer than four pairs
var tiny = clone(FIXTURE);
tiny.pairs = tiny.pairs.slice(0, 3);
check('too few pairs caught', validateSubject(tiny).length, 1);

// --- a confusable pointing at nothing is a typo in the word list
var ghost = clone(FIXTURE);
ghost.confusables[0].members.push('a99');
check('unknown confusable member caught', validateSubject(ghost).length, 1);
check('unknown member is named', errs(ghost).indexOf('a99') >= 0, true);

// --- a cluster of one distinguishes nothing
var lonely = clone(FIXTURE);
lonely.confusables[0].members = ['a1'];
check('single-member cluster caught', validateSubject(lonely).length, 1);

// --- missing metadata
var nameless = clone(FIXTURE);
delete nameless.sideA;
check('missing sideA caught', validateSubject(nameless).length, 1);

var idless = clone(FIXTURE);
idless.id = '';
check('missing id caught', validateSubject(idless).length, 1);

// --- notes are optional documentation, but must be usable prose if present
var noted = clone(FIXTURE);
noted.notes = ['Transcribed verbatim; do not normalize the punctuation.'];
check('notes are allowed', validateSubject(noted).length, 0);

// Removing notes from a subject that has them, so this exercises the
// optional path rather than repeating the bare-fixture check above.
var noNotes = clone(noted);
delete noNotes.notes;
check('notes are optional', validateSubject(noNotes).length, 0);

var badNotes = clone(FIXTURE);
badNotes.notes = 'a single string is not an array';
check('non-array notes caught', validateSubject(badNotes).length, 1);

var emptyNote = clone(FIXTURE);
emptyNote.notes = ['fine', ''];
check('empty note caught', validateSubject(emptyNote).length, 1);
check('empty note names its index', errs(emptyNote).indexOf('notes[1]') >= 0, true);

// --- a subject with no confusables at all is fine
var plain = clone(FIXTURE);
delete plain.confusables;
check('confusables are optional', validateSubject(plain).length, 0);

done('validate');
