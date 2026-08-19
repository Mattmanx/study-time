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

  // A -6..6 grid drawn in a 260x260 box. Both figures share it so the two
  // question types look like the same coordinate plane.
  var GRID = 6, PAD = 14, SPAN = 260;
  function gx(x) { return PAD + ((x + GRID) / (2 * GRID)) * (SPAN - 2 * PAD); }
  function gy(y) { return PAD + ((GRID - y) / (2 * GRID)) * (SPAN - 2 * PAD); }

  function gridSvg() {
    var parts = [], i;
    for (i = -GRID; i <= GRID; i++) {
      parts.push('<line x1="' + gx(i) + '" y1="' + gy(-GRID) +
                 '" x2="' + gx(i) + '" y2="' + gy(GRID) + '" class="grid"/>');
      parts.push('<line x1="' + gx(-GRID) + '" y1="' + gy(i) +
                 '" x2="' + gx(GRID) + '" y2="' + gy(i) + '" class="grid"/>');
    }
    parts.push('<line x1="' + gx(-GRID) + '" y1="' + gy(0) +
               '" x2="' + gx(GRID) + '" y2="' + gy(0) + '" class="axis"/>');
    parts.push('<line x1="' + gx(0) + '" y1="' + gy(-GRID) +
               '" x2="' + gx(0) + '" y2="' + gy(GRID) + '" class="axis"/>');
    return parts.join('');
  }

  var QUAD_CENTRE = {
    'I': [3, 3], 'II': [-3, 3], 'III': [-3, -3], 'IV': [3, -3]
  };

  function highlight(target) {
    if (target === 'origin') {
      return '<circle cx="' + gx(0) + '" cy="' + gy(0) + '" r="7" class="ring"/>';
    }
    if (target === 'x-axis') {
      return '<line x1="' + gx(-GRID) + '" y1="' + gy(0) + '" x2="' + gx(GRID) +
             '" y2="' + gy(0) + '" class="hi"/>';
    }
    if (target === 'y-axis') {
      return '<line x1="' + gx(0) + '" y1="' + gy(-GRID) + '" x2="' + gx(0) +
             '" y2="' + gy(GRID) + '" class="hi"/>';
    }
    var c = QUAD_CENTRE[target];
    if (!c) return '';
    var x0 = gx(Math.min(0, c[0] * 2)), x1 = gx(Math.max(0, c[0] * 2));
    var y0 = gy(Math.max(0, c[1] * 2)), y1 = gy(Math.min(0, c[1] * 2));
    return '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) +
           '" height="' + (y1 - y0) + '" class="quad"/>';
  }

  function lineSvg(xInt, yInt) {
    // The line through (xInt,0) and (0,yInt), extended to the grid edge.
    // slope = -yInt/xInt, and y = yInt + slope*x.
    var slope = -yInt / xInt;
    function yAt(x) { return yInt + slope * x; }
    var pts = [];
    var left = -GRID, right = GRID;
    var yl = yAt(left), yr = yAt(right);
    // Clip to the box so a steep line does not run off the figure.
    if (Math.abs(yl) > GRID) { left = (Math.sign(yl) * GRID - yInt) / slope; yl = yAt(left); }
    if (Math.abs(yr) > GRID) { right = (Math.sign(yr) * GRID - yInt) / slope; yr = yAt(right); }
    pts.push('<line x1="' + gx(left) + '" y1="' + gy(yl) + '" x2="' + gx(right) +
             '" y2="' + gy(yr) + '" class="plot"/>');
    return pts.join('');
  }

  function renderFigure(figure) {
    if (!figure) return '';
    var inner = gridSvg();
    if (figure.shape === 'plane') inner = highlight(figure.target) + inner;
    if (figure.shape === 'line') inner += lineSvg(figure.xInt, figure.yInt);
    return '<svg viewBox="0 0 ' + SPAN + ' ' + SPAN + '" width="' + SPAN +
           '" height="' + SPAN + '" role="img" aria-label="Coordinate plane">' +
           inner + '</svg>';
  }

  function startApp() {
    el('start-mock').onclick = function () { begin(createMockTest()); };
    el('back-to-menu').onclick = function (e) { e.preventDefault(); renderMenu(); };
    el('again').onclick = function () { renderMenu(); };
    renderMenu();
  }

  globalThis.renderTemplate = renderTemplate;
  globalThis.startApp = startApp;
  globalThis.renderFigure = renderFigure;
})();

document.addEventListener('DOMContentLoaded', function () { startApp(); });
