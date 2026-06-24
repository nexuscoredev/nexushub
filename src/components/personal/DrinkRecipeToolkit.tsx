import { useMemo, useState } from 'react';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import { isFixedIngredient, scaleIngredients } from '../../lib/drinkRecipeScale';
import styles from './ViniciusDrinksCarta.module.css';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

interface DrinkRecipeToolkitProps {
  drink: ViniciusDrink;
}

export function DrinkRecipeToolkit({ drink }: DrinkRecipeToolkitProps) {
  const [servings, setServings] = useState(1);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(() => new Set());

  const scaledIngredients = useMemo(
    () => scaleIngredients(drink.ingredients, servings),
    [drink.ingredients, servings],
  );

  const scalableCount = useMemo(
    () => drink.ingredients.filter((item) => !isFixedIngredient(item)).length,
    [drink.ingredients],
  );

  const stepsDone = checkedSteps.size;
  const stepsTotal = drink.steps.length;
  const allStepsDone = stepsTotal > 0 && stepsDone === stepsTotal;
  const progressPct = stepsTotal ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  const decServings = () => setServings((n) => Math.max(MIN_SERVINGS, n - 1));
  const incServings = () => setServings((n) => Math.min(MAX_SERVINGS, n + 1));

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const resetChecklist = () => setCheckedSteps(new Set());

  if (!drink.ingredients.length && !drink.steps.length) return null;

  return (
    <div className={styles.recipeToolkit}>
      <section className={styles.servingsPanel} aria-label="Quantidade de drinks">
        <div className={styles.servingsCopy}>
          <p className={styles.servingsLabel}>Quantos drinks vai fazer?</p>
          <p className={styles.servingsHint}>
            {servings === 1
              ? 'Receita para 1 porção'
              : `Receita ajustada para ${servings} porções`}
          </p>
        </div>
        <div className={styles.servingsControl}>
          <button
            type="button"
            className={styles.servingsBtn}
            onClick={decServings}
            disabled={servings <= MIN_SERVINGS}
            aria-label="Menos um drink"
          >
            −
          </button>
          <span className={styles.servingsValue} aria-live="polite">
            {servings}
          </span>
          <button
            type="button"
            className={styles.servingsBtn}
            onClick={incServings}
            disabled={servings >= MAX_SERVINGS}
            aria-label="Mais um drink"
          >
            +
          </button>
        </div>
      </section>

      {drink.ingredients.length ? (
        <section className={styles.recipeBlock}>
          <div className={styles.recipeBlockHead}>
            <h3 className={styles.recipeHeading}>Ingredientes</h3>
            {servings > 1 && scalableCount > 0 ? (
              <span className={styles.recipeBadge}>×{servings}</span>
            ) : null}
          </div>
          {servings > 1 ? (
            <p className={styles.ingredientsLead}>
              Você vai precisar de aproximadamente:
            </p>
          ) : null}
          <ul className={styles.ingredientsList}>
            {scaledIngredients.map((item, index) => {
              const scaled = servings > 1 && item !== drink.ingredients[index];
              const fixed = isFixedIngredient(item);
              return (
                <li
                  key={`${item}-${index}`}
                  className={[
                    styles.ingredientItem,
                    scaled ? styles.ingredientScaled : '',
                    fixed ? styles.ingredientFixed : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.ingredientDot} aria-hidden />
                  <span>{item}</span>
                  {fixed && servings > 1 && /a gosto/i.test(item) ? (
                    <span className={styles.ingredientTag}>a gosto</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {drink.garnish?.length ? (
            <div className={styles.recipeBlockHead}>
              <h4 className={styles.recipeHeading}>Guarnição</h4>
            </div>
          ) : null}
          {drink.garnish?.length ? (
            <ul className={styles.garnishList}>
              {drink.garnish.map((item) => (
                <li key={item} className={styles.garnishItem}>
                  <span className={styles.ingredientDot} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {drink.variations?.length ? (
            <>
              <div className={styles.recipeBlockHead}>
                <h4 className={styles.recipeHeading}>Variações</h4>
              </div>
              <ul className={styles.variationsList}>
                {drink.variations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {drink.notes ? <p className={styles.recipeNote}>{drink.notes}</p> : null}
        </section>
      ) : null}

      {drink.steps.length ? (
        <section className={styles.recipeBlock}>
          <div className={styles.recipeBlockHead}>
            <h3 className={styles.recipeHeading}>Passos</h3>
            <span className={styles.stepsProgressLabel}>
              {stepsDone}/{stepsTotal}
            </span>
          </div>

          <div
            className={styles.stepsProgressTrack}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da receita"
          >
            <span
              className={styles.stepsProgressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ol className={styles.stepsChecklist}>
            {drink.steps.map((step, index) => {
              const done = checkedSteps.has(index);
              return (
                <li key={step} className={done ? styles.stepDone : undefined}>
                  <button
                    type="button"
                    className={styles.stepCheck}
                    onClick={() => toggleStep(index)}
                    aria-pressed={done}
                    aria-label={`Passo ${index + 1}${done ? ', concluído' : ''}`}
                  >
                    <span className={styles.stepCheckBox} aria-hidden>
                      {done ? '✓' : ''}
                    </span>
                    <span className={styles.stepText}>{step}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {allStepsDone ? (
            <p className={styles.stepsComplete}>Pronto! Hora de servir.</p>
          ) : stepsDone > 0 ? (
            <button type="button" className={styles.stepsReset} onClick={resetChecklist}>
              Limpar checklist
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
