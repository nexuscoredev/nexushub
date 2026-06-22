import { useEffect, useMemo } from 'react';
import { formatMissingIngredients } from '../../lib/drinkAdegaMatch';
import { getNewDrinkSuggestions } from '../../lib/drinkCartaSuggestions';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import { listCartaSlugs } from '../../lib/viniciusDrinksCartaStore';
import type { DrinkCartaStore } from '../../lib/viniciusDrinksCartaStore';
import type { AdegaItem } from '../../lib/viniciusAdega';
import { DrinkThumb } from './DrinkThumb';
import styles from './ViniciusDrinksCarta.module.css';

interface DrinkNewSuggestionsProps {
  open: boolean;
  store: DrinkCartaStore;
  adegaItems: AdegaItem[];
  onClose: () => void;
  onAdd: (drink: ViniciusDrink) => void;
  onAddMany: (drinks: ViniciusDrink[]) => void;
}

export function DrinkNewSuggestions({
  open,
  store,
  adegaItems,
  onClose,
  onAdd,
  onAddMany,
}: DrinkNewSuggestionsProps) {
  const existingSlugs = useMemo(() => listCartaSlugs(store), [store]);

  const suggestions = useMemo(
    () => getNewDrinkSuggestions(existingSlugs, adegaItems),
    [existingSlugs, adegaItems],
  );

  const readySuggestions = useMemo(
    () => suggestions.filter((entry) => entry.match.status === 'ready'),
    [suggestions],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.newDrinksOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.newDrinksSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-drinks-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.newDrinksHead}>
          <div>
            <h3 id="new-drinks-title" className={styles.newDrinksTitle}>
              Sugestões de novos drinks
            </h3>
            <p className={styles.newDrinksLead}>
              Receitas clássicas fora da carta. Adicione com um toque — ingredientes, passos e notas
              entram completos.
            </p>
          </div>
          <button type="button" className={styles.newDrinksClose} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        {readySuggestions.length > 0 ? (
          <div className={styles.newDrinksBulkBar}>
            <p className={styles.newDrinksBulkText}>
              {readySuggestions.length}{' '}
              {readySuggestions.length === 1 ? 'receita pronta' : 'receitas prontas'} com sua adega
            </p>
            <button
              type="button"
              className={styles.newDrinksBulkBtn}
              onClick={() => onAddMany(readySuggestions.map((entry) => entry.drink))}
            >
              + Adicionar todas prontas
            </button>
          </div>
        ) : null}

        <div className={styles.newDrinksBody}>
          {suggestions.length === 0 ? (
            <p className={styles.newDrinksEmpty}>
              Você já adicionou todas as sugestões disponíveis. Em breve teremos mais receitas.
            </p>
          ) : (
            <ul className={styles.newDrinksList}>
              {suggestions.map(({ drink, match }) => (
                <li key={drink.slug} className={styles.newDrinksItem}>
                  <div className={styles.newDrinksCard}>
                    <DrinkThumb src={drink.imageUrl} alt="" className={styles.newDrinksPhoto} />
                    <div className={styles.newDrinksCardBody}>
                      <div className={styles.newDrinksCardTop}>
                        <h4 className={styles.newDrinksCardTitle}>{drink.title}</h4>
                        <span
                          className={
                            match.status === 'ready'
                              ? styles.newDrinksBadgeReady
                              : styles.newDrinksBadgePartial
                          }
                        >
                          {match.status === 'ready' ? 'Pronto' : 'Falta'}
                        </span>
                      </div>
                      <p className={styles.newDrinksCardTagline}>{drink.tagline}</p>
                      {match.missingLabels.length > 0 ? (
                        <p className={styles.newDrinksCardMissing}>
                          Falta: {formatMissingIngredients(match)}
                        </p>
                      ) : (
                        <p className={styles.newDrinksCardReady}>Todos os ingredientes na adega</p>
                      )}
                      <button
                        type="button"
                        className={styles.newDrinksAddBtn}
                        onClick={() => onAdd(drink)}
                      >
                        + Adicionar à carta
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
