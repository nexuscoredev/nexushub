const FIXED_INGREDIENT_RE =
  /a gosto|para decor|casquinha|rodela de limão|azeitona\b|^gelo[;,.\s]*$|^sal[;,.\s]*$/i;

/** Marca trechos já escalados para não multiplicar duas vezes (ex.: 1/2 dose → 1, não 2). */
const SCALED_MARK = '\uE000';

export function isFixedIngredient(text: string): boolean {
  return FIXED_INGREDIENT_RE.test(text.trim());
}

function formatQuantity(value: number): string {
  if (value <= 0) return '0';
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded + 1e-9);
  const frac = Math.round((rounded - whole) * 100) / 100;

  if (frac < 0.05) return String(whole);

  const fractionLabels: [number, string][] = [
    [0.25, '1/4'],
    [0.33, '1/3'],
    [0.5, '1/2'],
    [0.67, '2/3'],
    [0.75, '3/4'],
  ];

  for (const [target, label] of fractionLabels) {
    if (Math.abs(frac - target) < 0.04) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  return rounded.toFixed(1).replace(/\.0$/, '');
}

function scaleNumber(value: number, servings: number): number {
  return value * servings;
}

function markScaled(value: string): string {
  return `${SCALED_MARK}${value}${SCALED_MARK}`;
}

function stripScaledMarks(text: string): string {
  return text.replaceAll(SCALED_MARK, '');
}

function pluralizeUnit(unit: string, qty: number): string {
  if (qty <= 1) return unit;

  const lower = unit.toLowerCase();
  const pluralMap: Record<string, string> = {
    dose: 'doses',
    colher: 'colheres',
    'limão': 'limões',
    limao: 'limões',
    gota: 'gotas',
    pitada: 'pitadas',
    fruta: 'frutas',
  };

  const plural = pluralMap[lower];
  if (!plural) return unit;

  return unit[0] === unit[0].toUpperCase()
    ? plural.charAt(0).toUpperCase() + plural.slice(1)
    : plural;
}

/** Escala quantidades numéricas em linhas de ingrediente (base = 1 drink). */
export function scaleIngredient(ingredient: string, servings: number): string {
  if (servings === 1 || isFixedIngredient(ingredient)) return ingredient;

  let text = ingredient;

  text = text.replace(/\(([^)]*)\)/g, (paren) => {
    const inner = paren.slice(1, -1);
    const scaled = inner.replace(/(\d+)\s*ml/gi, (_, ml) => {
      return markScaled(`${Math.round(scaleNumber(Number(ml), servings))}ml`);
    });
    return `(${scaled})`;
  });

  text = text.replace(
    /(\d+)\s*\/\s*(\d+)(?:\s+(colheres?|doses?|dash|gotas?|pitadas?|lim[aã]o|limões?|limao|frutas?))?/gi,
    (_, num, den, unit) => {
      const scaled = scaleNumber(Number(num) / Number(den), servings);
      const formatted = formatQuantity(scaled);
      if (unit) {
        return markScaled(`${formatted} ${pluralizeUnit(unit, scaled)}`);
      }
      return markScaled(formatted);
    },
  );

  text = text.replace(/(?<!\uE000)(\d+)\s*ml/gi, (_, ml) => {
    return markScaled(`${Math.round(scaleNumber(Number(ml), servings))}ml`);
  });

  text = text.replace(/(\d+)\s+ou\s+(\d+)/gi, (_, a, b) => {
    return markScaled(
      `${Math.round(scaleNumber(Number(a), servings))} ou ${Math.round(scaleNumber(Number(b), servings))}`,
    );
  });

  text = text.replace(
    /(?<!\uE000)(\d+)\s+(colheres?|doses?|dash|gotas?|pitadas?|lim[aã]o|limões?|limao|frutas?)/gi,
    (_, qty, unit) => {
      const scaled = scaleNumber(Number(qty), servings);
      return markScaled(`${formatQuantity(scaled)} ${pluralizeUnit(unit, scaled)}`);
    },
  );

  if (/^\d+\s/.test(ingredient) && !/^\d+\s*\//.test(ingredient)) {
    text = text.replace(/^(\d+)(\s+)/, (_, qty, space) => {
      return markScaled(`${formatQuantity(scaleNumber(Number(qty), servings))}${space}`);
    });
  }

  return stripScaledMarks(text);
}

export function scaleIngredients(ingredients: string[], servings: number): string[] {
  return ingredients.map((item) => scaleIngredient(item, servings));
}
