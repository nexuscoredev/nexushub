import { useMemo } from 'react';
import { formatMissingIngredients, getDrinkSuggestions } from '../../lib/drinkAdegaMatch';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import type { AdegaItem } from '../../lib/viniciusAdega';
import { DrinkThumb } from './DrinkThumb';
import styles from './ViniciusDrinksCarta.module.css';

const ALMOST_LIMIT = 4;

interface DrinkAdegaSuggestionsProps {
  drinks: ViniciusDrink[];
  adegaItems: AdegaItem[];
  onOpenDrink: (slug: string) => void;
  onShowAllReady: () => void;
}

function SuggestionCard({
  drink,
  status,
  detail,
  onOpen,
}: {
  drink: ViniciusDrink;
  status: 'ready' | 'almost';
  detail: string;
  onOpen: () => void;
}) {
  return (
    <li className={styles.suggestItem}>
      <button type="button" className={styles.suggestCard} onClick={onOpen}>
        <span className={styles.suggestMedia}>
          <DrinkThumb src={drink.imageUrl} alt="" className={styles.suggestMediaImg} />
        </span>
        <span className={styles.suggestBody}>
          <span className={styles.suggestTitleRow}>
            <span className={styles.suggestTitle}>{drink.title}</span>
            <span
              className={
                status === 'ready' ? styles.suggestBadgeReady : styles.suggestBadgeAlmost
              }
            >
              {status === 'ready' ? 'Adega' : 'Falta'}
            </span>
          </span>
          <span className={styles.suggestDetail}>{detail}</span>
        </span>
      </button>
    </li>
  );
}

export function DrinkAdegaSuggestions({
  drinks,
  adegaItems,
  onOpenDrink,
  onShowAllReady,
}: DrinkAdegaSuggestionsProps) {
  const { ready, almost } = useMemo(
    () => getDrinkSuggestions(drinks, adegaItems),
    [drinks, adegaItems],
  );

  const almostVisible = almost.slice(0, ALMOST_LIMIT);

  if (ready.length === 0 && almost.length === 0) {
    return (
      <section className={styles.suggestions} aria-label="Sugestões da adega">
        <div className={styles.suggestionsHead}>
          <h3 className={styles.suggestionsTitle}>Sugestões da adega</h3>
          <p className={styles.suggestionsLead}>
            Nenhum drink completo com o estoque da adega. Cadastre bebidas e ingredientes (limão,
            xaropes, mixers…) para ver sugestões aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.suggestions} aria-label="Sugestões da adega">
      <div className={styles.suggestionsHead}>
        <div>
          <h3 className={styles.suggestionsTitle}>Sugestões da adega</h3>
          <p className={styles.suggestionsLead}>
            {ready.length > 0
              ? `${ready.length} ${ready.length === 1 ? 'drink' : 'drinks'} que você pode fazer agora`
              : 'Drinks quase completos com o que você tem'}
          </p>
        </div>
        {ready.length > 0 ? (
          <button type="button" className={styles.suggestionsLink} onClick={onShowAllReady}>
            Ver na lista
          </button>
        ) : null}
      </div>

      {ready.length > 0 ? (
        <div className={styles.suggestGroup}>
          <p className={styles.suggestGroupLabel}>Pode fazer agora</p>
          <ul className={styles.suggestRow}>
            {ready.map(({ drink, match }) => (
              <SuggestionCard
                key={drink.slug}
                drink={drink}
                status="ready"
                detail={match.matches.map((entry) => entry.itemName).join(' · ')}
                onOpen={() => onOpenDrink(drink.slug)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {almostVisible.length > 0 ? (
        <div className={styles.suggestGroup}>
          <p className={styles.suggestGroupLabel}>
            {ready.length > 0 ? 'Quase lá' : 'Falta pouco'}
          </p>
          <ul className={styles.suggestRow}>
            {almostVisible.map(({ drink, match }) => (
              <SuggestionCard
                key={drink.slug}
                drink={drink}
                status="almost"
                detail={
                  match.missingLabels.length > 0
                    ? `Falta: ${formatMissingIngredients(match)}`
                    : 'Ingredientes em falta'
                }
                onOpen={() => onOpenDrink(drink.slug)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
