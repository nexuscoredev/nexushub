import type { DrinkAdegaMatch } from '../../lib/drinkAdegaMatch';
import type { DrinkSubstitution } from '../../lib/drinkSubstitutions';
import styles from './ViniciusDrinksCarta.module.css';

interface DrinkAdegaAvailabilityProps {
  match: DrinkAdegaMatch;
  substitutions?: DrinkSubstitution[];
  compact?: boolean;
}

export function DrinkAdegaAvailability({
  match,
  substitutions = [],
  compact = false,
}: DrinkAdegaAvailabilityProps) {
  if (match.groups.length === 0) {
    return (
      <p className={styles.adegaMatchHint}>
        Esta receita não pede destilados da adega — ingredientes de cozinha ou mercado.
      </p>
    );
  }

  if (match.status === 'ready') {
    return (
      <section className={styles.adegaMatchPanel} aria-label="Disponível na adega">
        <p className={styles.adegaMatchTitle}>Você pode fazer com a sua adega</p>
        {!compact ? (
          <ul className={styles.adegaMatchList}>
            {match.matches.map((entry) => (
              <li key={entry.groupLabel} className={styles.adegaMatchItemReady}>
                <span className={styles.adegaMatchDotReady} aria-hidden />
                <span>
                  <strong>{entry.groupLabel}</strong> — {entry.itemName}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.adegaMatchPanel} aria-label="Status na adega">
      <p className={styles.adegaMatchTitle}>
        {match.status === 'partial'
          ? `Falta ${match.missingLabels.length} ${match.missingLabels.length === 1 ? 'item' : 'itens'} na adega`
          : 'Ingredientes em falta na adega'}
      </p>
      {match.missingLabels.length > 0 ? (
        <p className={styles.adegaMatchMissingSummary}>
          Falta: {match.missingLabels.join(', ')}
        </p>
      ) : null}
      <ul className={styles.adegaMatchList}>
        {match.matches.map((entry) => (
          <li key={`ok-${entry.groupLabel}`} className={styles.adegaMatchItemReady}>
            <span className={styles.adegaMatchDotReady} aria-hidden />
            <span>
              {entry.groupLabel} — {entry.itemName}
            </span>
          </li>
        ))}
        {match.missingLabels.map((label) => (
          <li key={`miss-${label}`} className={styles.adegaMatchItemMissing}>
            <span className={styles.adegaMatchDotMissing} aria-hidden />
            <span>Falta {label}</span>
          </li>
        ))}
      </ul>

      {substitutions.length > 0 ? (
        <div className={styles.substitutionPanel}>
          <p className={styles.substitutionTitle}>Substitutos na sua adega</p>
          <ul className={styles.substitutionList}>
            {substitutions.map((sub) => (
              <li key={`${sub.groupLabel}-${sub.itemId}`} className={styles.substitutionItem}>
                <span className={styles.substitutionLabel}>
                  Em vez de <strong>{sub.recipeWants}</strong>, use <strong>{sub.useInstead}</strong>
                </span>
                <span className={styles.substitutionNote}>{sub.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
