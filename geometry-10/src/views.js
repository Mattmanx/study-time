// All DOM rendering. Every other module is DOM-free and unit tested.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(id, on) { el(id).hidden = !on; }

  var LABELS = {
    'plane': 'Label the coordinate plane',
    'signs': 'Signs in each quadrant',
    'intercepts': 'x- and y-intercepts',
    'equation': 'Solve equations',
    'evaluate': 'Evaluate expressions',
    'fraction': 'Multiply and divide fractions',
    'radical-calc': 'Radicals with a calculator',
    'radical-exact': 'Radicals without a calculator',
    'exponent': 'Exponents'
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Blanks before the active one show what was entered; the active one is an
  // input; later ones are dimmed placeholders.
  function renderTemplate(template, blanks, activeName, filled) {
    return template.replace(/\{(\w+)\}/g, function (_, name) {
      if (name === activeName) {
        return '<input id="answer" type="text" inputmode="text" ' +
               'spellcheck="false" autocomplete="off" autocorrect="off" ' +
               'autocapitalize="off" aria-label="Answer">';
      }
      if (filled && filled.hasOwnProperty(name)) {
        var cls = filled[name].shown ? 'shown' : 'filled';
        return '<span class="' + cls + '">' +
               escapeHtml(filled[name].text) + '</span>';
      }
      return '<span class="todo">___</span>';
    });
  }

  // Replaced by the real implementation in Task 10. Until then, figures
  // render as nothing rather than throwing.
  function renderFigure() { return ''; }

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
    if (p.type === 'radical-calc') note = 'Calculator OK — round to the hundredths place.';
    if (p.type === 'radical-exact') note = 'No calculator. The answer must be exact — no decimals.';
    el('calc-note').textContent = note;
    show('calc-note', note !== '');

    el('figure').innerHTML = p.figure ? renderFigure(p.figure) : '';

    var ol = el('steps');
    ol.innerHTML = '';
    for (var i = 0; i < p.steps.length; i++) {
      var step = p.steps[i];
      var li = document.createElement('li');
      li.className = i < cur.stepIndex ? 'past' : (i === cur.stepIndex ? 'active' : '');
      var active = (i === cur.stepIndex) ? cur.blankName : null;
      var filled = filledByStep[i] || {};
      // Steps not yet reached stay blank so they do not give the game away.
      var body = (i <= cur.stepIndex)
        ? renderTemplate(step.template, step.blanks, active, filled)
        : '';
      li.innerHTML = '<div class="say">' + escapeHtml(step.say) + '</div>' +
                     '<div class="line">' + body + '</div>';
      ol.appendChild(li);
    }

    var fb = el('feedback');
    fb.textContent = feedback || '';
    fb.className = tone || '';

    var input = el('answer');
    if (input) {
      input.focus();
      input.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); onSubmit(input.value); }
      };
    }
  }

  function onSubmit(text) {
    var cur = session.current();
    if (!cur) return;
    var stepIndex = cur.stepIndex, name = cur.blankName;
    var result = session.submit(text);

    if (result.status === 'unreduced') {
      renderQuiz('Right value — now simplify it completely.', 'bad'); return;
    }
    if (result.status === 'malformed') {
      renderQuiz('Type an answer first.', 'bad'); return;
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
    if (a.kind === 'pair') return '(' + a.x + ', ' + a.y + ')';
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
