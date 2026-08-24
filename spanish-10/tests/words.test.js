load('../shared/vocab/tests/helpers.js');
load('../shared/vocab/validate.js');
load('../shared/vocab/quiz.js');
globalThis.SUBJECT = JSON.parse(read('src/words.json'));

// --- the word list survives the shared validator
check('word list is valid', validateSubject(SUBJECT).join(' | '), '');
check('the study guide has 29 pairs', SUBJECT.pairs.length, 29);

function english(spanish) {
  for (var i = 0; i < SUBJECT.pairs.length; i++) {
    if (SUBJECT.pairs[i].a === spanish) return SUBJECT.pairs[i].b;
  }
  return '(not found)';
}

// --- spot checks against the answer key
check('Hola.', english('Hola.'), 'Hello');
check('Adiós.', english('Adiós.'), 'Goodbye');
check('Se llama...', english('Se llama...'), 'his/her name is');
check('Te/Le presento a...', english('Te/Le presento a...'),
      'Let me introduce you (familiar/formal) to...');
check('malo/a', english('malo/a'), 'bad');

// --- the parentheticals are the only thing separating these six items.
// Without them the questions have two right answers and cannot be answered.
check('familiar estás', english('¿Cómo estás?'), 'How are you? (familiar)');
check('formal usted', english('¿Cómo está usted?'), 'How are you? (formal)');
check('familiar tú', english('¿Y tú?'), 'and you (familiar)');
check('formal y usted', english('¿Y usted?'), 'And you? (form.)');
check('your name', english('¿Cómo te llamas?'), 'What is your name?');
check('his or her name', english('¿Cómo se llama?'), 'What is his/her name?');

// --- the key's punctuation is preserved exactly as printed
check('Hasta luego carries no period', english('Hasta luego'), 'See you later');
check('Encantado(a) closes its parenthesis',
      english('Encantado(a)'), 'delighted');

// --- every confusable cluster resolves to a note
var unnoted = 0;
for (var c = 0; c < SUBJECT.confusables.length; c++) {
  var members = SUBJECT.confusables[c].members;
  for (var m = 0; m < members.length; m++) {
    var idx = -1;
    for (var p = 0; p < SUBJECT.pairs.length; p++) {
      if (SUBJECT.pairs[p].a === members[m]) idx = p;
    }
    if (idx === -1 || noteFor(SUBJECT, idx) === '') unnoted += 1;
  }
}
check('every clustered word has a note', unnoted, 0);
check('eight clusters declared', SUBJECT.confusables.length, 8);

// --- a full round in each direction is answerable end to end
var modes = [MODE_A_TO_B, MODE_B_TO_A];
for (var mi = 0; mi < modes.length; mi++) {
  var round = createRound(SUBJECT, modes[mi], { rng: makeRng(31 + mi) });
  var asked = 0;
  while (!round.isDone() && asked < 200) {
    round.answer(round.current().answer);
    asked += 1;
  }
  check('a full round covers 29 questions in ' + modes[mi], asked, 29);
  check('a clean round scores 29 in ' + modes[mi], round.summary().clean, 29);
}

done('words');
