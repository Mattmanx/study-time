// All DOM. Every other module in the framework is DOM-free and unit tested.
// Nothing here knows what the subject is: labels come from SUBJECT.sideA and
// SUBJECT.sideB, so the same file serves a language quiz and a science one.
(function () {
  var CORRECT_PAUSE_MS = 650;
  // The second press of a real double-click hit-tests against the DOM that has
  // already been swapped in, so disabling the clicked node cannot stop it —
  // by then that node is gone and the point may sit over a fresh option.
  // Guard the destination instead: ignore option clicks that arrive sooner
  // than a person could have read a prompt they have not seen before.
  var SETTLE_MS = 250;

  var app = document.getElementById('app');
  var round = null;
  var progress = loadProgress();
  var pending = null;   // timer id for the pause after a correct answer
  var renderedAt = 0;   // when the current question was painted

  function loadProgress() {
    try {
      return parseProgress(window.localStorage.getItem(storageKey(SUBJECT)));
    } catch (e) {
      return emptyProgress();
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(storageKey(SUBJECT),
                                  serializeProgress(progress));
    } catch (e) { /* private browsing, a full disk: not worth interrupting */ }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function modeLabel(mode) {
    var keys = sideKeys(mode);
    var from = keys.prompt === 'a' ? SUBJECT.sideA : SUBJECT.sideB;
    var to = keys.answer === 'a' ? SUBJECT.sideA : SUBJECT.sideB;
    return from.name + ' → ' + to.name;
  }

  function langOf(side) {
    return (side === 'a' ? SUBJECT.sideA : SUBJECT.sideB).lang || 'en';
  }

  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
  }

  // ---------- menu ----------

  function renderMenu() {
    clearPending();
    round = null;
    var modes = [MODE_A_TO_B, MODE_B_TO_A];
    var html = '<p class="crumb"><a href="../index.html">← All topics</a></p>' +
      '<h1>' + escapeHtml(SUBJECT.title) + '</h1>' +
      '<p class="sub">' + escapeHtml(SUBJECT.subtitle || '') + '</p>' +
      '<h2>Choose a direction</h2><ul class="modes">';
    for (var i = 0; i < modes.length; i++) {
      // Coerce once: stored progress is user-editable, and a non-numeric best
      // would otherwise be written into the markup unescaped.
      var best = Number(bestScore(progress, modes[i])) || 0;
      html += '<li><button type="button" data-mode="' + modes[i] + '">' +
        '<span>' + escapeHtml(modeLabel(modes[i])) + '</span>' +
        '<span class="best">' +
        (best ? 'Best ' + best + ' of ' + SUBJECT.pairs.length : 'Not tried yet') +
        '</span></button></li>';
    }
    html += '</ul>';

    var spots = troubleSpots(progress).slice(0, 5);
    if (spots.length) {
      html += '<h2>Worth reviewing</h2><ul class="trouble">';
      for (var s = 0; s < spots.length; s++) {
        var misses = Number(spots[s].misses) || 0;
        html += '<li>' + escapeHtml(spots[s].text) + ' · missed ' + misses +
                (misses === 1 ? ' time' : ' times') + '</li>';
      }
      html += '</ul>';
    }
    app.innerHTML = html;

    var buttons = app.querySelectorAll('.modes button');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', function (ev) {
        startRound(ev.currentTarget.getAttribute('data-mode'), null);
      });
    }
  }

  // ---------- quiz ----------

  function startRound(mode, items) {
    clearPending();
    round = createRound(SUBJECT, mode, {
      items: items,
      retry: !!items
    });
    renderQuestion();
  }

  function renderQuestion() {
    var q = round.current();
    if (!q) { renderDone(); return; }
    var keys = sideKeys(round.mode());
    var html = '<p class="crumb"><a href="#" id="to-menu">← Menu</a></p>' +
      '<p id="progress">' + escapeHtml(round.progressText()) + '</p>' +
      '<p class="prompt" lang="' + escapeHtml(langOf(keys.prompt)) + '">' +
      escapeHtml(q.prompt) + '</p><ul class="options">';
    for (var i = 0; i < q.options.length; i++) {
      html += '<li><button type="button" class="option" data-index="' + i +
        '" lang="' + escapeHtml(langOf(keys.answer)) + '">' +
        escapeHtml(q.options[i]) + '</button></li>';
    }
    html += '</ul><p id="feedback" aria-live="polite"></p>';
    app.innerHTML = html;

    document.getElementById('to-menu').addEventListener('click', function (ev) {
      ev.preventDefault();
      renderMenu();
    });
    var buttons = app.querySelectorAll('.option');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', onChoose);
    }
    if (buttons.length) buttons[0].focus();
    renderedAt = Date.now();
  }

  function optionButtons() { return app.querySelectorAll('.option'); }

  function disableAll(fade) {
    var buttons = optionButtons();
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (fade && !buttons[i].className.match(/wrong|right/)) {
        buttons[i].className += ' faded';
      }
    }
  }

  function setFeedback(html) {
    document.getElementById('feedback').innerHTML = html;
  }

  function onChoose(ev) {
    var button = ev.currentTarget;
    if (button.disabled) return;
    // Too soon to be a considered answer: this is the tail of a double-click
    // that started on the previous screen. Swallow it rather than record it.
    if (Date.now() - renderedAt < SETTLE_MS) return;
    var q = round.current();                 // snapshot BEFORE answering
    var chosen = q.options[Number(button.getAttribute('data-index'))];
    var result = round.answer(chosen);

    if (result.status === 'retry') {
      // The question stays up. Only the wrong choice is taken away.
      button.className = 'option wrong';
      button.disabled = true;
      setFeedback('<span class="verdict bad">Not that one.</span> ' +
                  'Try again — one more go.');
      var remaining = optionButtons();
      for (var i = 0; i < remaining.length; i++) {
        if (!remaining[i].disabled) { remaining[i].focus(); break; }
      }
      return;
    }

    if (result.correct) {
      button.className = 'option right';
      disableAll(true);
      setFeedback('<span class="verdict good">' +
                  (result.status === 'correct' ? 'Correct.' : 'Right — second try.') +
                  '</span>');
      pending = window.setTimeout(function () {
        pending = null;
        renderQuestion();
      }, CORRECT_PAUSE_MS);
      return;
    }

    // Revealed: out of tries in a main round, or a miss in a retry round.
    button.className = 'option wrong';
    var rightIdx = q.options.indexOf(result.answer);
    var right = rightIdx === -1 ? null : optionButtons()[rightIdx];
    if (right) right.className = 'option right';
    disableAll(true);
    var answerSide = sideKeys(round.mode()).answer;
    setFeedback('<span class="verdict bad">The answer is ' +
                '<span lang="' + escapeHtml(langOf(answerSide)) + '">' +
                escapeHtml(result.answer) + '</span>.</span>' +
                (result.note ? '<span class="note">' + escapeHtml(result.note) +
                 '</span>' : '') +
                '<button type="button" class="primary" id="next">Next</button>');
    // Disable before re-rendering: a fast second click would otherwise land on
    // whatever now occupies that point — often an option of the next question.
    document.getElementById('next').addEventListener('click', function () {
      if (this.disabled) return;
      this.disabled = true;
      renderQuestion();
    });
    document.getElementById('next').focus();
  }

  // ---------- done ----------

  function pairRow(index, tier) {
    var pair = SUBJECT.pairs[index];
    var tag = tier === 'second' ? 'second try' : 'missed';
    return '<li class="' + tier + '"><span class="tag">' + tag + '</span>' +
      '<span class="term" lang="' + escapeHtml(langOf('a')) + '">' +
      escapeHtml(pair.a) + '</span> — ' +
      '<span class="gloss" lang="' + escapeHtml(langOf('b')) + '">' +
      escapeHtml(pair.b) + '</span></li>';
  }

  function reviewList(summary) {
    if (!summary.unclean.length) return '';
    var html = '<h2>Review these</h2><ul class="review">';
    for (var s = 0; s < summary.second.length; s++) {
      html += pairRow(summary.second[s], 'second');
    }
    for (var m = 0; m < summary.missed.length; m++) {
      html += pairRow(summary.missed[m], 'missed');
    }
    return html + '</ul>';
  }

  function renderDone() {
    clearPending();
    var summary = round.summary();
    var wasRetry = round.isRetry();
    var mode = round.mode();

    // Only main rounds are scored. A retry round covers a different, smaller
    // list, so its "score" is not comparable and would corrupt the best.
    if (!wasRetry) {
      progress = recordRound(progress, SUBJECT, mode, summary);
      saveProgress();
    }

    var html = '<p class="crumb"><a href="#" id="to-menu">← Menu</a></p>';
    if (wasRetry) {
      html += '<h1>All caught up</h1>' +
        '<p>Every word on the list answered correctly — ' +
        summary.total + (summary.total === 1 ? ' word' : ' words') + '.</p>';
    } else {
      html += '<h1>Round complete</h1>' +
        '<p class="score">' + summary.clean +
        '<small>of ' + summary.total + ' right on the first try</small></p>';
      if (summary.second.length) {
        html += '<p>' + summary.second.length +
          (summary.second.length === 1 ? ' word took' : ' words took') +
          ' a second try.</p>';
      }
      html += reviewList(summary);
    }

    html += '<p>';
    if (!wasRetry && summary.unclean.length) {
      html += '<button type="button" class="primary" id="retry">' +
        'Retry the ' + summary.unclean.length + ' you missed</button>';
    }
    html += '<button type="button" class="secondary" id="again">' +
      (wasRetry ? 'Back to menu' : 'Run the whole list again') + '</button></p>';
    app.innerHTML = html;

    document.getElementById('to-menu').addEventListener('click', function (ev) {
      ev.preventDefault();
      renderMenu();
    });
    var retry = document.getElementById('retry');
    if (retry) {
      var items = summary.unclean.slice();
      retry.addEventListener('click', function () { startRound(mode, items); });
      retry.focus();
    }
    var again = document.getElementById('again');
    again.addEventListener('click', function () {
      if (wasRetry) { renderMenu(); } else { startRound(mode, null); }
    });
    // The retry screen has no #retry to take focus, so this is the only
    // button on it: without this a keyboard user lands at the top of the page.
    if (!retry) again.focus();
  }

  document.title = SUBJECT.title;
  renderMenu();
})();
