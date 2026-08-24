// A small invented subject. The engine must never care what the sides mean,
// so the fixture is not a real language.
globalThis.FIXTURE = {
  id: 'fixture-1',
  title: 'Fixture Subject',
  subtitle: 'Test data only',
  sideA: { name: 'Alpha', lang: 'en' },
  sideB: { name: 'Beta', lang: 'en' },
  pairs: [
    { a: 'a1', b: 'b1' },
    { a: 'a2', b: 'b2' },
    { a: 'a3', b: 'b3' },
    { a: 'a4', b: 'b4' },
    { a: 'a5', b: 'b5' },
    { a: 'a6', b: 'b6' }
  ],
  confusables: [
    { members: ['a1', 'a2'], note: 'a1 and a2 are easy to mix up.' }
  ]
};
