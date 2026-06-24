import { matchDrinkToAdega, extractDrinkRequirementGroups } from '../src/lib/drinkAdegaMatch.ts';

const adegaBeer = [{ id: '1', name: 'Cerveja clara', category: 'Cerveja', quantity: 2 }];

const cases = [
  {
    ingredient: 'Ou garrafa de cerveja clara , bem gelada',
    expectLabel: /^Cerveja clara$/i,
    expectReady: true,
    forbidLabel: /\bou\b|bem gelada/i,
  },
  {
    ingredient: '1 lata ou garrafa de cerveja clara, bem gelada',
    expectLabel: /^Cerveja clara$/i,
    expectReady: true,
    forbidLabel: /bem gelada|1 lata ou/i,
  },
  {
    ingredient: 'Refrigerante de cola ou garrafa de cerveja clara, bem gelada',
    expectLabel: /^Cerveja clara$/i,
    expectReady: true,
    forbidLabel: /refrigerante|bem gelada/i,
  },
  {
    ingredient: '2 latas de cerveja clara, bem geladas',
    expectLabel: /^Cerveja clara$/i,
    expectReady: true,
    forbidLabel: /bem gelada/i,
  },
];

let failed = 0;

for (const testCase of cases) {
  const drink = {
    slug: 't',
    title: 'T',
    tagline: '',
    imageUrl: '',
    ingredients: [testCase.ingredient],
    steps: [],
  };

  const groups = extractDrinkRequirementGroups(drink);
  const match = matchDrinkToAdega(drink, adegaBeer);
  const label = groups[0]?.label ?? '';
  const ok =
    testCase.expectLabel.test(label) &&
    match.status === (testCase.expectReady ? 'ready' : 'missing') &&
    (!testCase.forbidLabel || !testCase.forbidLabel.test(label));

  if (!ok) failed += 1;

  console.log(
    JSON.stringify({
      ingredient: testCase.ingredient,
      label,
      ruleIds: groups[0]?.ruleIds,
      status: match.status,
      ok,
    }),
  );
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${cases.length} cases passed`);
}
