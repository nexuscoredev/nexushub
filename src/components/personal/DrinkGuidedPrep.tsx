import { useEffect, useMemo, useState } from 'react';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import { isFixedIngredient, scaleIngredients } from '../../lib/drinkRecipeScale';
import styles from './ViniciusDrinksCarta.module.css';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;
const SHAKE_SECONDS = 15;

type Phase = 'setup' | 'ingredients' | 'steps' | 'done';

type DrinkGuidedPrepProps = {
  drink: ViniciusDrink;
  open: boolean;
  onClose: () => void;
};

function stepNeedsTimer(step: string): boolean {
  return /agite|shake|bata|misture\s+por/i.test(step);
}

export function DrinkGuidedPrep({ drink, open, onClose }: DrinkGuidedPrepProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [servings, setServings] = useState(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(() => new Set());
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const scaledIngredients = useMemo(
    () => scaleIngredients(drink.ingredients, servings),
    [drink.ingredients, servings],
  );

  useEffect(() => {
    if (!open) {
      setPhase('setup');
      setServings(1);
      setStepIndex(0);
      setCheckedIngredients(new Set());
      setTimerLeft(0);
      setTimerRunning(false);
    }
  }, [open, drink.slug]);

  useEffect(() => {
    if (!timerRunning || timerLeft <= 0) return;
    const id = window.setInterval(() => {
      setTimerLeft((value) => {
        if (value <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerLeft]);

  if (!open) return null;

  const allIngredientsChecked =
    scaledIngredients.length === 0 || checkedIngredients.size === scaledIngredients.length;
  const currentStep = drink.steps[stepIndex];
  const showTimer = currentStep && stepNeedsTimer(currentStep);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const startPrep = () => setPhase('ingredients');

  const goToSteps = () => {
    setStepIndex(0);
    setPhase('steps');
  };

  const nextStep = () => {
    if (stepIndex >= drink.steps.length - 1) {
      setPhase('done');
      return;
    }
    setStepIndex((value) => value + 1);
    setTimerLeft(0);
    setTimerRunning(false);
  };

  const prevStep = () => {
    setStepIndex((value) => Math.max(0, value - 1));
    setTimerLeft(0);
    setTimerRunning(false);
  };

  const startTimer = () => {
    setTimerLeft(SHAKE_SECONDS);
    setTimerRunning(true);
  };

  return (
    <div className={styles.guidedOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.guidedSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-prep-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.guidedHead}>
          <button type="button" className={styles.guidedClose} onClick={onClose} aria-label="Fechar">
            ×
          </button>
          <p className={styles.guidedEyebrow}>Modo preparo</p>
          <h2 id="guided-prep-title" className={styles.guidedTitle}>
            {drink.title}
          </h2>
        </header>

        {phase === 'setup' ? (
          <div className={styles.guidedBody}>
            <p className={styles.guidedLead}>Quantas porções vai preparar?</p>
            <div className={styles.servingsControl}>
              <button
                type="button"
                className={styles.servingsBtn}
                onClick={() => setServings((n) => Math.max(MIN_SERVINGS, n - 1))}
                disabled={servings <= MIN_SERVINGS}
              >
                −
              </button>
              <span className={styles.servingsValue}>{servings}</span>
              <button
                type="button"
                className={styles.servingsBtn}
                onClick={() => setServings((n) => Math.min(MAX_SERVINGS, n + 1))}
                disabled={servings >= MAX_SERVINGS}
              >
                +
              </button>
            </div>
            <button type="button" className={styles.guidedPrimaryBtn} onClick={startPrep}>
              Começar
            </button>
          </div>
        ) : null}

        {phase === 'ingredients' ? (
          <div className={styles.guidedBody}>
            <p className={styles.guidedLead}>Separe tudo antes de começar</p>
            <ul className={styles.guidedIngredientList}>
              {scaledIngredients.map((item, index) => {
                const done = checkedIngredients.has(index);
                const fixed = isFixedIngredient(item);
                return (
                  <li key={`${item}-${index}`}>
                    <button
                      type="button"
                      className={`${styles.guidedIngredientBtn} ${done ? styles.guidedIngredientDone : ''}`}
                      onClick={() => toggleIngredient(index)}
                      aria-pressed={done}
                    >
                      <span className={styles.stepCheckBox} aria-hidden>
                        {done ? '✓' : ''}
                      </span>
                      <span>{item}</span>
                      {fixed ? <span className={styles.ingredientTag}>a gosto</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {drink.garnish?.length ? (
              <p className={styles.guidedGarnish}>Guarnição: {drink.garnish.join(', ')}</p>
            ) : null}
            <button
              type="button"
              className={styles.guidedPrimaryBtn}
              onClick={goToSteps}
              disabled={!allIngredientsChecked}
            >
              Próximo: passos
            </button>
          </div>
        ) : null}

        {phase === 'steps' && currentStep ? (
          <div className={styles.guidedBody}>
            <p className={styles.guidedStepCount}>
              Passo {stepIndex + 1} de {drink.steps.length}
            </p>
            <p className={styles.guidedStepText}>{currentStep}</p>
            {showTimer ? (
              <div className={styles.guidedTimer}>
                {timerRunning || timerLeft > 0 ? (
                  <span className={styles.guidedTimerValue}>{timerLeft}s</span>
                ) : (
                  <button type="button" className={styles.guidedTimerBtn} onClick={startTimer}>
                    Iniciar timer ({SHAKE_SECONDS}s)
                  </button>
                )}
              </div>
            ) : null}
            <div className={styles.guidedNav}>
              <button
                type="button"
                className={styles.guidedSecondaryBtn}
                onClick={prevStep}
                disabled={stepIndex === 0}
              >
                Anterior
              </button>
              <button type="button" className={styles.guidedPrimaryBtn} onClick={nextStep}>
                {stepIndex >= drink.steps.length - 1 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className={styles.guidedBody}>
            <p className={styles.guidedDone}>Pronto! Hora de servir 🍸</p>
            <button type="button" className={styles.guidedPrimaryBtn} onClick={onClose}>
              Fechar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
