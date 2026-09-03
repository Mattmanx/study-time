load('tests/helpers.js');
load('src/checker.js');

function st(text, spec) { return checkAnswer(text, spec).status; }

// --- integers still behave as they did in Test #1
var INT = { kind: 'int', value: 16 };
check('int exact', st('16', INT), 'correct');
check('int unicode minus', st('−14', { kind: 'int', value: -14 }), 'correct');
check('int wrong', st('15', INT), 'wrong');
check('int garbage', st('abc', INT), 'malformed');
check('int empty', st('', INT), 'malformed');
check('int zero vs blank', st('', { kind: 'int', value: 0 }), 'malformed');
// An exact distance may be handed in written out to the rounding place.
var FIFTEEN = { kind: 'int', value: 15 };
check('int as 15.000', st('15.000', FIFTEEN), 'correct');
check('int as 15.0', st('15.0', FIFTEEN), 'correct');
check('int 15.001 is wrong not correct', st('15.001', FIFTEEN), 'wrong');

// --- decimal3: the distance formula's rounding instruction
var D3 = { kind: 'decimal3', value: 11.402 };
check('d3 exact', st('11.402', D3), 'correct');
check('d3 too few places', st('11.4', D3), 'needs-thousandths');
check('d3 hundredths only', st('11.40', D3), 'needs-thousandths');
check('d3 too many places', st('11.4022', D3), 'needs-thousandths');
check('d3 wrong value', st('11.403', D3), 'wrong');
check('d3 garbage', st('eleven', D3), 'malformed');

// --- pairs with non-integer components: the midpoint of two odd coordinates.
// This is the case Test #1's checker could not express at all.
var MID = blankSpec('(−1.5, −2)');
check('midpoint spec is a pair', MID.kind, 'pair');
check('mid decimal', st('(-1.5, -2)', MID), 'correct');
check('mid unicode minus', st('(−1.5, −2)', MID), 'correct');
check('mid as a fraction', st('(-3/2, -2)', MID), 'correct');
check('mid unreduced fraction', st('(-6/4, -2)', MID), 'correct');
check('mid no parens', st('-1.5, -2', MID), 'correct');
// The bug this replaced: label matching stripped the minus signs, so the
// positive pair graded as correct.
check('mid sign flip is wrong', st('(1.5, 2)', MID), 'wrong');
check('mid swapped', st('(-2, -1.5)', MID), 'wrong');
check('mid rounded away', st('(-2, -2)', MID), 'wrong');
check('mid malformed', st('(-1.5)', MID), 'malformed');
// Integer pairs keep working.
var PR = blankSpec('(3, 0)');
check('int pair', st('(3,0)', PR), 'correct');
check('int pair wrong', st('(0,3)', PR), 'wrong');

// --- segments have no direction
var SEG = blankSpec('LK');
check('segment spec', SEG.kind, 'segment');
check('seg as written', st('LK', SEG), 'correct');
check('seg reversed', st('KL', SEG), 'correct');
check('seg lowercase', st('kl', SEG), 'correct');
check('seg wrong letters', st('LM', SEG), 'wrong');
check('seg one letter', st('L', SEG), 'malformed');

// --- angle names: the sign is optional, the letter ORDER is not
var ANG = blankSpec('∠DEF');
check('angle spec', ANG.kind, 'angle');
check('angle with sign', st('∠DEF', ANG), 'correct');
check('angle bare', st('DEF', ANG), 'correct');
check('angle with <', st('<DEF', ANG), 'correct');
check('angle spelled out', st('angle DEF', ANG), 'correct');
check('angle with m prefix', st('m∠DEF', ANG), 'correct');
check('angle lowercase', st('def', ANG), 'correct');
// Reversing is a different naming and the question says which end leads.
check('angle reversed', st('FED', ANG), 'wrong');
check('angle vertex moved', st('EDF', ANG), 'wrong');
// A single-letter angle name whose letter is M. The "m" of "m∠ABC" must be
// stripped only while the sign is still attached, or ∠M normalizes to the
// empty string and grades as malformed -- and a malformed answer costs no
// attempt, so that blank can never be passed or revealed. It is the third
// congruency statement of the study guide's own problem.
var ANGM = blankSpec('∠M');
check('single-letter M angle spec', ANGM.kind, 'angle');
check('angle M with sign', st('∠M', ANGM), 'correct');
check('angle M bare', st('M', ANGM), 'correct');
check('angle M lowercase', st('m', ANGM), 'correct');
check('angle M spelled out', st('angle M', ANGM), 'correct');
check('angle M vs another letter', st('∠L', ANGM), 'wrong');
check('angle M is never malformed', st('∠M', ANGM) === 'malformed', false);
// The m-prefix leniency it was competing with must still work.
check('m prefix still stripped', st('m∠ABC', blankSpec('∠ABC')), 'correct');

var NUM = blankSpec('∠5');
check('numbered angle spec', NUM.kind, 'angle');
check('numbered angle', st('∠5', NUM), 'correct');
check('numbered angle bare', st('5', NUM), 'correct');
check('numbered angle wrong', st('6', NUM), 'wrong');

// --- labels: the vocabulary-style classify answers
var LAB = blankSpec('acute angle');
check('label spec', LAB.kind, 'label');
check('label exact', st('acute angle', LAB), 'correct');
check('label spacing', st('Acute  Angle', LAB), 'correct');
check('label hyphen', st('acute-angle', LAB), 'correct');
check('label wrong', st('obtuse angle', LAB), 'wrong');
check('label empty', st('', LAB), 'malformed');

// --- inference must not confuse the new kinds with each other
check('two capitals are a segment', blankSpec('AB').kind, 'segment');
check('a word is a label', blankSpec('right angle').kind, 'label');
check('three decimals is decimal3', blankSpec('11.402').kind, 'decimal3');
check('two decimals is decimal2', blankSpec('15.81').kind, 'decimal2');
check('an op is still an op', blankSpec('÷4').kind, 'op');
check('a plain number is an int', blankSpec('20').kind, 'int');

done('checker');
