// Checks a subject's word list for the mistakes that hand-transcription makes.
// A duplicate string on one side silently creates a question with two correct
// options, which is worse than a crash: the student is marked wrong for being
// right. This runs in each subject's own test suite, so a typo fails the build.
(function () {
  var MIN_PAIRS = 4;   // four distinct options are impossible below this

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.length > 0;
  }

  function validateSubject(subject) {
    var errors = [];
    if (!subject || typeof subject !== 'object') {
      return ['subject is not an object'];
    }
    if (!isNonEmptyString(subject.id)) errors.push('subject.id is missing');
    if (!isNonEmptyString(subject.title)) errors.push('subject.title is missing');
    for (var s = 0; s < 2; s++) {
      var key = s === 0 ? 'sideA' : 'sideB';
      var side = subject[key];
      if (!side || !isNonEmptyString(side.name)) {
        errors.push('subject.' + key + '.name is missing');
      }
    }

    var pairs = subject.pairs;
    if (!(pairs instanceof Array) || pairs.length < MIN_PAIRS) {
      errors.push('subject.pairs needs at least ' + MIN_PAIRS + ' entries');
      return errors;
    }

    var seen = { a: {}, b: {} };
    var sides = ['a', 'b'];
    for (var i = 0; i < pairs.length; i++) {
      for (var k = 0; k < sides.length; k++) {
        var name = sides[k];
        var text = pairs[i][name];
        if (!isNonEmptyString(text)) {
          errors.push('pair ' + i + ' side ' + name + ' is empty');
          continue;
        }
        if (text !== text.trim()) {
          errors.push('pair ' + i + ' side ' + name + ' has stray whitespace: "' + text + '"');
          continue;
        }
        if (seen[name].hasOwnProperty(text)) {
          errors.push('duplicate side ' + name + ' entry: "' + text + '"');
        }
        seen[name][text] = true;
      }
    }

    var clusters = subject.confusables || [];
    for (var c = 0; c < clusters.length; c++) {
      var members = clusters[c].members || [];
      if (members.length < 2) {
        errors.push('confusable cluster ' + c + ' needs at least two members');
      }
      if (!isNonEmptyString(clusters[c].note)) {
        errors.push('confusable cluster ' + c + ' has no note');
      }
      for (var m = 0; m < members.length; m++) {
        if (!seen.a.hasOwnProperty(members[m])) {
          errors.push('confusable member is not a side A entry: "' + members[m] + '"');
        }
      }
    }
    return errors;
  }

  globalThis.MIN_PAIRS = MIN_PAIRS;
  globalThis.validateSubject = validateSubject;
})();
