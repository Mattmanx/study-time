load('tests/helpers.js');
load('src/checker.js');

function st(text, spec) { return checkAnswer(text, spec).status; }

// --- integers
var INT = { kind: 'int', value: 16 };
check('int exact', st('16', INT), 'correct');
check('int spaced', st('  16 ', INT), 'correct');
check('int wrong', st('15', INT), 'wrong');
check('int garbage', st('abc', INT), 'malformed');
check('int empty', st('', INT), 'malformed');
var NEG = { kind: 'int', value: -14 };
check('int negative', st('-14', NEG), 'correct');
check('int unicode minus', st('−14', NEG), 'correct');
// Zero must not be confused with blank -- P1 #7 and P2 #9 both answer 0.
var ZERO = { kind: 'int', value: 0 };
check('int zero', st('0', ZERO), 'correct');
check('int zero vs blank', st('', ZERO), 'malformed');

// --- fractions: right value but unreduced is its own status, not "wrong"
var FR = { kind: 'fraction', num: 6, den: 5 };
check('frac exact', st('6/5', FR), 'correct');
check('frac unreduced', st('108/90', FR), 'unreduced');
check('frac wrong', st('5/6', FR), 'wrong');
check('frac malformed', st('6/', FR), 'malformed');
check('frac div by zero', st('6/0', FR), 'malformed');
// A whole number answer expressed as a fraction is still correct.
var FR1 = { kind: 'fraction', num: 3, den: 1 };
check('frac whole as int', st('3', FR1), 'correct');
check('frac whole as frac', st('3/1', FR1), 'correct');
check('frac negative', st('-3/7', { kind: 'fraction', num: -3, den: 7 }), 'correct');

// --- ordered pairs
var PAIR = { kind: 'pair', x: -4, y: 0 };
check('pair parens', st('(-4,0)', PAIR), 'correct');
check('pair spaced', st('( -4 , 0 )', PAIR), 'correct');
check('pair bare', st('-4,0', PAIR), 'correct');
check('pair swapped', st('(0,-4)', PAIR), 'wrong');
check('pair malformed', st('-4', PAIR), 'malformed');

// --- decimals: exactly hundredths (type 7)
var DEC = { kind: 'decimal2', value: 15.81 };
check('dec exact', st('15.81', DEC), 'correct');
check('dec too coarse', st('15.8', DEC), 'needs-hundredths');
check('dec integer', st('15', DEC), 'needs-hundredths');
check('dec too fine', st('15.811', DEC), 'needs-hundredths');
check('dec wrong', st('15.82', DEC), 'wrong');
check('dec trailing zero ok', st('10.49', { kind: 'decimal2', value: 10.49 }), 'correct');

// --- radicals: exact only (type 8)
var RAD = { kind: 'radical', coef: 5, rad: 10 };
check('rad unicode', st('5√10', RAD), 'correct');
check('rad sqrt word', st('5 sqrt 10', RAD), 'correct');
check('rad r form', st('5r10', RAD), 'correct');
check('rad decimal rejected', st('15.81', RAD), 'needs-exact');
check('rad unsimplified', st('√250', RAD), 'wrong');
check('rad wrong', st('5√11', RAD), 'wrong');
// Coefficient 1 is written bare: sqrt(14) not 1*sqrt(14). Accept both.
var RAD1 = { kind: 'radical', coef: 1, rad: 14 };
check('rad implicit one', st('√14', RAD1), 'correct');
check('rad explicit one', st('1√14', RAD1), 'correct');

// --- quadrant signs
var SIGNS = { kind: 'signs', x: '-', y: '+' };
check('signs plain', st('-,+', SIGNS), 'correct');
check('signs parens', st('( -, + )', SIGNS), 'correct');
check('signs wrong', st('+,-', SIGNS), 'wrong');

// --- labels
var LAB = { kind: 'label', value: 'x-axis' };
check('label exact', st('x-axis', LAB), 'correct');
check('label case', st('X-Axis', LAB), 'correct');
check('label spaces', st('x axis', LAB), 'correct');
check('label wrong', st('y-axis', LAB), 'wrong');

// --- blankSpec infers a grading rule from a blank's declared value
check('spec number', blankSpec(-144).kind, 'int');
check('spec number value', blankSpec(-144).value, -144);
check('spec fraction', blankSpec('27/20').kind, 'fraction');
check('spec fraction num', blankSpec('27/20').num, 27);
check('spec pair', blankSpec('(-4,0)').kind, 'pair');
check('spec pair x', blankSpec('(-4,0)').x, -4);
check('spec radical', blankSpec('5√10').kind, 'radical');
check('spec radical rad', blankSpec('5√10').rad, 10);
check('spec decimal', blankSpec('15.81').kind, 'decimal2');
check('spec signs', blankSpec('-,+').kind, 'signs');
check('spec signs x', blankSpec('-,+').x, '-');
check('spec label', blankSpec('x-axis').kind, 'label');
check('spec label quadrant', blankSpec('quadrant II').kind, 'label');
// Round trip: a blank's own declared value must grade as correct.
check('spec round trip int', checkAnswer('-144', blankSpec(-144)).status, 'correct');
check('spec round trip frac', checkAnswer('27/20', blankSpec('27/20')).status, 'correct');
check('spec round trip pair', checkAnswer('(-4,0)', blankSpec('(-4,0)')).status, 'correct');
check('spec round trip rad', checkAnswer('5√10', blankSpec('5√10')).status, 'correct');

done('checker');
