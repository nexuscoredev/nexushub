const FIXED_INGREDIENT_RE =
  /a gosto|para decor|casquinha|rodela de limão|azeitona\b|^gelo[;,.\s]*$|^sal[;,.\s]*$/i;

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

/** Escala quantidades numéricas em linhas de ingrediente (base = 1 drink). */
export function scaleIngredient(ingredient: string, servings: number): string {
  if (servings === 1 || isFixedIngredient(ingredient)) return ingredient;

  let text = ingredient;

  text = text.replace(/\(([^)]*)\)/g, (paren) => {
    const inner = paren.slice(1, -1);
    const scaled = inner.replace(/(\d+)\s*ml/gi, (_, ml) => {
      return `${Math.round(scaleNumber(Number(ml), servings))}ml`;
    });
    return `(${scaled})`;
  });

  text = text.replace(/(\d+)\s*\/\s*(\d+)/g, (_, num, den) => {
    return formatQuantity(scaleNumber(Number(num) / Number(den), servings));
  });

  text = text.replace(/(\d+)\s*ml/gi, (_, ml) => {
    return `${Math.round(scaleNumber(Number(ml), servings))}ml`;
  });

  text = text.replace(/(\d+)\s+ou\s+(\d+)/gi, (_, a, b) => {
    return `${Math.round(scaleNumber(Number(a), servings))} ou ${Math.round(scaleNumber(Number(b), servings))}`;
  });

  text = text.replace(
    /(\d+)\s+(colheres?|doses?|dash|gotas?|pitadas?|limões?|limao|frutas?)/gi,
    (_, qty, unit) => `${formatQuantity(scaleNumber(Number(qty), servings))} ${unit}`,
  );

  if (/^\d+\s/.test(ingredient)) {
    text = text.replace(/^(\d+)(\s+)/, (_, qty, space) => {
      return `${formatQuantity(scaleNumber(Number(qty), servings))}${space}`;
    });
  }

  return text;
}

export function scaleIngredients(ingredients: string[], servings: number): string[] {
  return ingredients.map((item) => scaleIngredient(item, servings));
}
