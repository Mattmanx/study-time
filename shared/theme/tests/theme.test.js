load('tests/helpers.js');
load('theme.js');

// --- a stored value is untrusted: it is whatever survived in someone's
// browser, including junk written by something else on the same origin.
check('stores light', parseTheme('light'), 'light');
check('stores dark', parseTheme('dark'), 'dark');
check('rejects unknown', parseTheme('solarized'), null);
check('rejects empty', parseTheme(''), null);
check('rejects null', parseTheme(null), null);
check('rejects undefined', parseTheme(undefined), null);
check('rejects a number', parseTheme(1), null);
check('rejects an object', parseTheme({ theme: 'dark' }), null);
check('is case sensitive', parseTheme('Dark'), null);
check('rejects whitespace padding', parseTheme(' dark'), null);

// --- with no choice recorded, the OS decides. This is exactly what the tools
// did before there was a toggle, so an untouched browser sees no change.
check('no choice, dark OS', resolveTheme(null, true), 'dark');
check('no choice, light OS', resolveTheme(null, false), 'light');
check('junk choice falls back to the OS', resolveTheme('nonsense', true), 'dark');
check('empty choice falls back to the OS', resolveTheme('', false), 'light');

// --- a recorded choice overrides the OS in BOTH directions. Getting only one
// direction right is the usual bug, and it is the direction that matters here:
// a light choice on a dark Mac.
check('light chosen on a dark OS', resolveTheme('light', true), 'light');
check('dark chosen on a light OS', resolveTheme('dark', false), 'dark');
check('light chosen on a light OS', resolveTheme('light', false), 'light');
check('dark chosen on a dark OS', resolveTheme('dark', true), 'dark');

// --- toggling
check('dark toggles to light', nextTheme('dark'), 'light');
check('light toggles to dark', nextTheme('light'), 'dark');
check('toggling twice returns', nextTheme(nextTheme('light')), 'light');

// --- the button names where it is going, not where it is. A button reading
// "Dark" on a dark page reads as a status and gets clicked expecting nothing.
check('on light, offers dark', toggleLabel('light'), 'Dark');
check('on dark, offers light', toggleLabel('dark'), 'Light');
check('label matches the destination', toggleLabel('light'),
      nextTheme('light').charAt(0).toUpperCase() + nextTheme('light').slice(1));

// --- every resolved theme must be one the stylesheet actually defines, or a
// page renders with no palette at all.
var DEFINED = { light: 1, dark: 1 };
var undefinedTheme = 0;
var stored = [null, undefined, '', 'light', 'dark', 'bogus', 42];
for (var i = 0; i < stored.length; i++) {
  for (var d = 0; d < 2; d++) {
    var t = resolveTheme(stored[i], d === 1);
    if (DEFINED[t] !== 1) { undefinedTheme += 1; print('  undefined theme: ' + t); }
    if (DEFINED[nextTheme(t)] !== 1) { undefinedTheme += 1; }
  }
}
check('every resolved theme is one the CSS defines', undefinedTheme, 0);

// --- the key is part of the contract: the <head> bootstrap in each app.html
// hardcodes this string, and they have to agree or the saved choice is lost
// and every load flashes.
check('storage key', THEME_STORAGE_KEY, 'study-time.theme');

// --- loading this file without a document must not throw. That is what lets
// it be tested at all, and it is the line most likely to be "tidied" away.
check('exports its logic without a DOM', typeof resolveTheme, 'function');
check('no DOM means no startTheme wiring', typeof startTheme, 'undefined');

done('theme');
