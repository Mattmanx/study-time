globalThis.__results = { pass: 0, fail: 0 };

globalThis.check = function (label, actual, expected) {
  if (actual === expected) {
    __results.pass += 1;
  } else {
    __results.fail += 1;
    print("FAIL  " + label + "\n      expected " + expected + ", got " + actual);
  }
};

globalThis.done = function (suite) {
  print(suite + ": " + __results.pass + " passed, " + __results.fail + " failed");
  if (__results.fail > 0) throw new Error(suite + " had failures");
};
