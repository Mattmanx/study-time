// Light/dark choice, shared by every tool. The palette itself is theme.css;
// this file only decides which of the two is showing and remembers it.
//
// The decision logic is DOM-free and exported, so it runs under jsc like the
// rest of the repository. Everything that touches the document lives below
// startTheme(), which is only wired up when there IS a document -- that is
// what lets the test suite load this file at all.
(function () {
  var STORAGE_KEY = 'study-time.theme';
  var THEMES = { light: 1, dark: 1 };

  // A stored value is whatever survived in someone's browser: an old key, a
  // hand-edited string, junk from another app on the same origin. Anything
  // that is not one of the two themes means "no choice recorded".
  function parseTheme(raw) {
    return (typeof raw === 'string' && THEMES[raw] === 1) ? raw : null;
  }

  // No stored choice means follow the operating system, which is what the
  // tools did before there was a toggle at all.
  function resolveTheme(stored, systemPrefersDark) {
    var chosen = parseTheme(stored);
    if (chosen !== null) return chosen;
    return systemPrefersDark ? 'dark' : 'light';
  }

  function nextTheme(current) {
    return current === 'dark' ? 'light' : 'dark';
  }

  // What the button should say NEXT -- it names the destination, not the
  // current state, because "Dark" on a dark page reads as a status label and
  // people click it expecting nothing to happen.
  function toggleLabel(current) {
    return current === 'dark' ? 'Light' : 'Dark';
  }

  globalThis.parseTheme = parseTheme;
  globalThis.resolveTheme = resolveTheme;
  globalThis.nextTheme = nextTheme;
  globalThis.toggleLabel = toggleLabel;
  globalThis.THEME_STORAGE_KEY = STORAGE_KEY;

  if (typeof document === 'undefined') return;

  function read() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function write(theme) {
    // Private browsing throws on write. A theme that does not persist is a
    // small annoyance; a page that will not load is not.
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }

  function systemDark() {
    return !!(window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  var SUN = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2' +
            'M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4' +
            'M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>';
  var MOON = '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>';

  function icon(next) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           (next === 'dark' ? MOON : SUN) + '</svg>';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function startTheme() {
    // The <head> bootstrap has usually applied the stored theme already; this
    // repeats it so the attribute is right even on a page without one, and so
    // the current theme is known here without re-reading the DOM.
    var current = resolveTheme(read(), systemDark());
    apply(current);

    var button = document.createElement('button');
    button.className = 'theme-toggle';
    button.type = 'button';

    function render() {
      var next = nextTheme(current);
      button.innerHTML = icon(next) + '<span>' + toggleLabel(current) + '</span>';
      button.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      button.title = 'Switch to ' + next + ' mode';
    }

    button.onclick = function () {
      current = nextTheme(current);
      apply(current);
      write(current);
      render();
    };

    render();
    document.body.appendChild(button);

    // Until a choice is made the page tracks the OS live, so a Mac flipping
    // to dark at sunset carries the tools with it. After a choice, it does
    // not -- the choice is the point.
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (parseTheme(read()) !== null) return;
        current = systemDark() ? 'dark' : 'light';
        apply(current);
        render();
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  globalThis.startTheme = startTheme;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTheme);
  } else {
    startTheme();
  }
})();
