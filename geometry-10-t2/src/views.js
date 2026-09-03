// All DOM rendering. Every other module is DOM-free and unit tested.
// Copied from geometry-10. The coordinate-plane drawing that lived at the
// bottom of that file is gone: this test's figures are segments, rays and
// triangles, and they live in figures.js.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(id, on) { el(id).hidden = !on; }

  var LABELS = {
    'segment-addition': 'Segment Addition Postulate',
    'distance': 'Distance formula',
    'midpoint': 'Midpoint formula',
    'angle-naming': 'Name an angle 4 ways',
    'angle-classify': 'Classify angles',
    'congruence': 'Congruency statements',
    'angle-addition': 'Angle Addition Postulate',
    'bisector': 'Angle bisectors'
  };

  // What the answer should look like, shown greyed in the empty box.
  var SHAPE = {
    'pair': '(3, 0)', 'fraction': '3/4', 'radical': '5\u221a10',
    'decimal2': '0.00', 'decimal3': '0.000', 'op': '+5', 'signs': '+,\u2212',
    'segment': 'AB', 'angle': '\u2220ABC'
  };
  function placeholderFor(spec) { return SHAPE[spec.kind] || ''; }

  // "Type an answer first" is only true of an empty box. If something was
  // typed and could not be read, say what shape was expected instead.
  var SHAPE_HELP = {
    'pair': 'Give it as an ordered pair, like (3, 0).',
    'fraction': 'Write it as a fraction, like 3/4.',
    'radical': 'Write it in exact form, like 5\u221a10.',
    'decimal2': 'Give a decimal to the hundredths place, like 5.92.',
    'decimal3': 'Give a decimal to the thousandths place, like 11.402.',
    'op': 'Write the operation, like +5 or \u00f73.',
    'signs': 'Give the two signs, like +,\u2212.',
    'segment': 'Name the segment by its two endpoints, like AB.',
    'angle': 'Name the angle, like \u2220ABC or \u22203.',
    'int': 'That does not look like a number.'
  };
  function malformedMessage(spec, typed) {
    if (String(typed).trim() === '') return 'Type an answer first.';
    return SHAPE_HELP[spec.kind] || 'That answer could not be read.';
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Blanks before the active one show what was entered; the active one is an
  // input; later ones are dimmed placeholders.
  function renderTemplate(template, blanks, activeName, filled) {
    return template.replace(/\{(\w+)\}/g, function (_, name) {
      if (name === activeName) {
        var ph = placeholderFor(blankSpec(blanks[name]));
        return '<input id="answer" type="text" inputmode="text" ' +
               'spellcheck="false" autocomplete="off" autocorrect="off" ' +
               'autocapitalize="off" aria-label="Answer"' +
               (ph ? ' placeholder="' + ph + '"' : '') + '>';
      }
      if (filled && filled.hasOwnProperty(name)) {
        var cls = filled[name].shown ? 'shown' : 'filled';
        return '<span class="' + cls + '">' +
               escapeHtml(filled[name].text) + '</span>';
      }
      return '<span class="todo">___</span>';
    });
  }

  // The answer key writes the operation under each side with a rule beneath,
  // then the new equation. Steps that only rewrite ("Distribute the 2") carry
  // no opL/opR and get no row.
  function renderOpRow(step, activeName, filled) {
    if (!step.blanks.hasOwnProperty('opL')) return '';
    function cell(name) {
      return '<span class="opcell">' +
             renderTemplate('{' + name + '}', step.blanks, activeName, filled) +
             '</span>';
    }
    return '<div class="oprow">' + cell('opL') + cell('opR') + '</div>' +
           '<div class="oprule"></div>';
  }

  var session = null, progress = null, filledByStep = {};

  function loadProgress() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
    return parseProgress(raw);
  }

  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, serializeProgress(p)); }
    catch (e) { /* private browsing: progress simply will not persist */ }
  }

  function renderMenu() {
    progress = loadProgress();
    var list = el('topic-list');
    list.innerHTML = '';
    for (var i = 0; i < TYPES.length; i++) {
      (function (type) {
        var streak = masteryStreak(progress, type);
        var pct = Math.min(100, (streak / MASTERY_TARGET) * 100);
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.innerHTML = '<span>' + escapeHtml(LABELS[type]) + '</span>' +
                      '<span class="bar"><i style="width:' + pct + '%"></i></span>';
        b.onclick = function () { begin(createDrill(type)); };
        li.appendChild(b); list.appendChild(li);
      })(TYPES[i]);
    }
    var spots = troubleSpots(progress);
    show('trouble', spots.length > 0);
    var tl = el('trouble-list');
    tl.innerHTML = '';
    for (var s = 0; s < spots.length; s++) {
      var li2 = document.createElement('li');
      li2.textContent = LABELS[spots[s].type] + ' — missed ' +
                        spots[s].misses + (spots[s].misses === 1 ? ' time' : ' times');
      tl.appendChild(li2);
    }
    show('menu-screen', true); show('quiz-screen', false); show('done-screen', false);
  }

  function begin(s) {
    session = s; filledByStep = {};
    show('menu-screen', false); show('done-screen', false); show('quiz-screen', true);
    renderQuiz('');
  }

  function renderQuiz(feedback, tone) {
    var cur = session.current();
    if (cur === null) { renderDone(); return; }
    var p = cur.problem;

    el('progress').textContent = session.progressText();
    el('prompt').innerHTML = escapeHtml(p.prompt);

    var note = '';
    if (p.type === 'distance') note = 'Round to the nearest thousandth only if it does not come out exact.';
    if (p.type === 'congruence') note = 'Equal tick marks pair the sides; equal arcs pair the angles.';
    if (p.type === 'angle-classify') note = 'Assume the angle is drawn to scale.';
    el('calc-note').textContent = note;
    show('calc-note', note !== '');

    el('figure').innerHTML = p.figure ? renderFigure(p.figure) : '';

    var ol = el('steps');
    ol.innerHTML = '';
    // Only steps already reached are rendered at all. Listing the remaining
    // instructions would hand over the method, and choosing the next
    // operation is itself what the test asks for.
    for (var i = 0; i <= cur.stepIndex && i < p.steps.length; i++) {
      var step = p.steps[i];
      var li = document.createElement('li');
      li.className = i < cur.stepIndex ? 'past' : 'active';
      var active = (i === cur.stepIndex) ? cur.blankName : null;
      var filled = filledByStep[i] || {};
      li.innerHTML = '<div class="say">' + escapeHtml(step.say) + '</div>' +
                     renderOpRow(step, active, filled) +
                     '<div class="line">' +
                     renderTemplate(step.template, step.blanks, active, filled) +
                     '</div>';
      ol.appendChild(li);
    }
    if (cur.stepIndex + 1 < p.steps.length) {
      var more = document.createElement('li');
      more.className = 'more';
      more.textContent = 'next step appears when this one is right';
      ol.appendChild(more);
    }

    var fb = el('feedback');
    fb.textContent = feedback || '';
    fb.className = tone || '';

    var input = el('answer');
    var check = el('check');
    if (input) {
      input.focus();
      input.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); onSubmit(input.value); }
      };
      // Enter alone is fine on a laptop, but there is no comfortable Enter
      // key on a tablet.
      check.onclick = function () { onSubmit(input.value); };
    }
    show('controls', input !== null);
  }

  function onSubmit(text) {
    var cur = session.current();
    if (!cur) return;
    var stepIndex = cur.stepIndex, name = cur.blankName;
    var result = session.submit(text);

    if (result.status === 'unreduced') {
      renderQuiz('Right value — now simplify it completely.', 'bad'); return;
    }
    if (result.status === 'needs-hundredths' || result.status === 'needs-thousandths') {
      var places = result.status === 'needs-hundredths' ? 'hundredths' : 'thousandths';
      renderQuiz('Round it to the ' + places + ' place — that many digits exactly.', 'bad');
      return;
    }
    if (result.status === 'malformed') {
      var spec = blankSpec(cur.problem.steps[stepIndex].blanks[name]);
      renderQuiz(malformedMessage(spec, text), 'bad'); return;
    }
    if (result.status === 'correct' || result.status === 'revealed') {
      filledByStep[stepIndex] = filledByStep[stepIndex] || {};
      filledByStep[stepIndex][name] = {
        text: result.status === 'revealed'
              ? String(cur.problem.steps[stepIndex].blanks[name]) : text,
        shown: result.status === 'revealed'
      };
    }
    if (result.status === 'correct') {
      if (session.current() && session.current().problem !== cur.problem) {
        filledByStep = {};
      }
      renderQuiz('', 'good'); return;
    }
    if (result.status === 'wrong') {
      renderQuiz(result.hint || 'Not quite — try that step again.', 'bad'); return;
    }
    if (result.status === 'revealed') {
      if (session.current() && session.current().problem !== cur.problem) {
        filledByStep = {};
      }
      renderQuiz(result.hint, 'bad'); return;
    }
    renderDone();
  }

  function renderDone() {
    progress = loadProgress();
    var missed = session.missed();
    var seen = {};
    for (var i = 0; i < missed.length; i++) { seen[missed[i].problem.id] = missed[i].problem; }
    // Replay each finished problem so the stored streak matches the one the
    // session used, instead of collapsing a whole session into one result.
    var finished = session.results();
    for (var r = 0; r < finished.length; r++) {
      progress = recordResult(progress, finished[r].type,
                              finished[r].problemId, finished[r].clean);
    }
    saveProgress(progress);

    el('done-title').textContent = missed.length === 0 ? 'Clean sweep' : 'Session complete';
    el('done-score').textContent = 'Score: ' + session.score();
    var rl = el('review-list');
    rl.innerHTML = '';
    for (var id in seen) {
      if (seen.hasOwnProperty(id)) {
        var li = document.createElement('li');
        li.textContent = seen[id].prompt + '  →  ' + describeAnswer(seen[id].answer);
        rl.appendChild(li);
      }
    }
    show('quiz-screen', false); show('done-screen', true);
  }

  function describeAnswer(a) {
    if (a.kind === 'fraction') return a.num + '/' + a.den;
    if (a.kind === 'radical') return (a.coef === 1 ? '' : a.coef) + '√' + a.rad;
    // Pair components are fractions now, because a midpoint lands on halves.
    if (a.kind === 'pair') {
      return '(' + fractionText(a.x) + ', ' + fractionText(a.y) + ')';
    }
    if (a.kind === 'signs') return '(' + a.x + ', ' + a.y + ')';
    return String(a.value);
  }

  function startApp() {
    el('start-mock').onclick = function () { begin(createMockTest()); };
    el('back-to-menu').onclick = function (e) { e.preventDefault(); renderMenu(); };
    el('again').onclick = function () { renderMenu(); };
    renderMenu();
  }

  globalThis.renderTemplate = renderTemplate;
  globalThis.startApp = startApp;
})();

document.addEventListener('DOMContentLoaded', function () { startApp(); });
