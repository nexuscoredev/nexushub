import { inferDrinkCategory, DRINK_CATEGORY_CHIPS } from '../../lib/drinkCartaDiscover';
import { formatMissingIngredients, type DrinkAdegaMatch } from '../../lib/drinkAdegaMatch';
import type { DrinkCartaViewMode } from '../../lib/drinkCartaView';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import type { DrinkCartaStore } from '../../lib/viniciusDrinksCartaStore';
import { getDrinkMeta, isFavorite } from '../../lib/viniciusDrinksCartaStore';
import { DrinkThumb } from './DrinkThumb';
import styles from './ViniciusDrinksCarta.module.css';

type DrinkCartaListProps = {
  drinks: ViniciusDrink[];
  store: DrinkCartaStore;
  viewMode: DrinkCartaViewMode;
  editing: boolean;
  adegaMatches: Map<string, DrinkAdegaMatch>;
  favoriteSlugs: Set<string>;
  onOpenDrink: (slug: string) => void;
  onEditDrink: (slug: string) => void;
};

function categoryLabel(drink: ViniciusDrink): string {
  const id = inferDrinkCategory(drink);
  return DRINK_CATEGORY_CHIPS.find((chip) => chip.id === id)?.label ?? 'Clássico';
}

function adegaStatusLabel(match: DrinkAdegaMatch | undefined): string {
  if (!match) return '—';
  if (match.status === 'ready') return 'Pronto';
  if (match.missingLabels.length > 0) return `Falta: ${formatMissingIngredients(match)}`;
  return 'Parcial';
}

function DrinkBadges({
  drinkIsFavorite,
  drinkMeta,
  match,
}: {
  drinkIsFavorite: boolean;
  drinkMeta: ReturnType<typeof getDrinkMeta>;
  match: DrinkAdegaMatch | undefined;
}) {
  return (
    <>
      {drinkIsFavorite ? (
        <span className={styles.favoriteBtnActive} aria-hidden>
          ★
        </span>
      ) : null}
      {drinkMeta.tried ? (
        <span className={styles.cardTriedBadge} title="Já provei">
          ✓
        </span>
      ) : null}
      {drinkMeta.rating ? (
        <span className={styles.cardRatingBadge} title={`Nota ${drinkMeta.rating}`}>
          ★{drinkMeta.rating}
        </span>
      ) : null}
      {match?.status === 'ready' ? <span className={styles.cardAdegaBadge}>Adega</span> : null}
      {match && match.status !== 'ready' && match.missingLabels.length > 0 ? (
        <span
          className={styles.cardAdegaBadgePartial}
          title={`Falta: ${formatMissingIngredients(match)}`}
        >
          Falta
        </span>
      ) : null}
    </>
  );
}

function EditingCard({
  drink,
  onEdit,
  onOpen,
}: {
  drink: ViniciusDrink;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={`${styles.card} ${styles.cardEditing}`}>
      <button type="button" className={styles.cardEditMedia} onClick={onEdit} aria-label={`Editar ${drink.title}`}>
        <span className={styles.cardMedia}>
          <DrinkThumb src={drink.imageUrl} alt="" className={styles.cardMediaImg} />
        </span>
        <span className={styles.cardEditBadge}>✎</span>
      </button>
      <button type="button" className={styles.cardEditBody} onClick={onEdit}>
        <span className={styles.cardTitle}>{drink.title}</span>
        <span className={styles.cardTagline}>{drink.tagline}</span>
      </button>
      <button type="button" className={styles.cardPreviewBtn} onClick={onOpen} aria-label={`Ver ${drink.title}`}>
        →
      </button>
    </div>
  );
}

function DrinkCard({
  drink,
  viewMode,
  drinkIsFavorite,
  drinkMeta,
  match,
  onOpen,
}: {
  drink: ViniciusDrink;
  viewMode: DrinkCartaViewMode;
  drinkIsFavorite: boolean;
  drinkMeta: ReturnType<typeof getDrinkMeta>;
  match: DrinkAdegaMatch | undefined;
  onOpen: () => void;
}) {
  const previewIngredient = drink.ingredients[0]?.replace(/;\s*$/, '') ?? '';
  const showTagline = viewMode === 'content' || viewMode === 'tiles' || viewMode.startsWith('icons-');
  const showPreview = viewMode === 'content';

  return (
    <button
      type="button"
      className={`${styles.card} ${styles[`cardView_${viewMode}`]}`}
      onClick={onOpen}
    >
      <span className={styles.cardMedia}>
        <DrinkThumb src={drink.imageUrl} alt="" className={styles.cardMediaImg} />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{drink.title}</span>
          <DrinkBadges
            drinkIsFavorite={drinkIsFavorite}
            drinkMeta={drinkMeta}
            match={match}
          />
        </span>
        {showTagline ? <span className={styles.cardTagline}>{drink.tagline}</span> : null}
        {showPreview && previewIngredient ? (
          <span className={styles.cardContentPreview}>{previewIngredient}</span>
        ) : null}
        {viewMode === 'content' && match && match.missingLabels.length > 0 ? (
          <span className={styles.cardAdegaMissing}>
            Falta: {formatMissingIngredients(match)}
          </span>
        ) : null}
      </span>
      {viewMode !== 'tiles' && !viewMode.startsWith('icons-') ? (
        <span className={styles.cardArrow} aria-hidden>
          →
        </span>
      ) : null}
    </button>
  );
}

export function DrinkCartaList({
  drinks,
  store,
  viewMode,
  editing,
  adegaMatches,
  favoriteSlugs,
  onOpenDrink,
  onEditDrink,
}: DrinkCartaListProps) {
  if (viewMode === 'details' && !editing) {
    return (
      <div className={styles.detailsTable} role="table" aria-label="Carta de drinks">
        <div className={styles.detailsHead} role="row">
          <span role="columnheader">Drink</span>
          <span role="columnheader" className={styles.detailsColType}>
            Tipo
          </span>
          <span role="columnheader" className={styles.detailsColAdega}>
            Adega
          </span>
          <span role="columnheader" className={styles.detailsColRating}>
            Nota
          </span>
        </div>
        <ul className={`${styles.list} ${styles.listView_details}`}>
          {drinks.map((drink) => {
            const match = adegaMatches.get(drink.slug);
            const drinkMeta = getDrinkMeta(store, drink.slug);
            return (
              <li key={drink.slug} role="row">
                <button type="button" className={styles.detailsRow} onClick={() => onOpenDrink(drink.slug)}>
                  <span className={styles.detailsDrinkCell} role="cell">
                    <span className={styles.detailsThumb}>
                      <DrinkThumb src={drink.imageUrl} alt="" className={styles.cardMediaImg} />
                    </span>
                    <span className={styles.detailsDrinkText}>
                      <span className={styles.cardTitle}>{drink.title}</span>
                      <span className={styles.detailsDrinkMeta}>
                        {isFavorite(store, drink.slug) ? '★ ' : ''}
                        {drinkMeta.tried ? '✓ ' : ''}
                      </span>
                    </span>
                  </span>
                  <span className={styles.detailsColType} role="cell">
                    {categoryLabel(drink)}
                  </span>
                  <span className={styles.detailsColAdega} role="cell">
                    {adegaStatusLabel(match)}
                  </span>
                  <span className={styles.detailsColRating} role="cell">
                    {drinkMeta.rating ? `★ ${drinkMeta.rating}` : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const listClass = editing
    ? styles.list
    : `${styles.list} ${styles[`listView_${viewMode}`] ?? ''}`;

  return (
    <ul className={listClass}>
      {drinks.map((drink) => {
        const match = adegaMatches.get(drink.slug);
        const drinkIsFavorite = favoriteSlugs.has(drink.slug);
        const drinkMeta = getDrinkMeta(store, drink.slug);

        return (
          <li key={drink.slug}>
            {editing ? (
              <EditingCard
                drink={drink}
                onEdit={() => onEditDrink(drink.slug)}
                onOpen={() => onOpenDrink(drink.slug)}
              />
            ) : (
              <DrinkCard
                drink={drink}
                viewMode={viewMode}
                drinkIsFavorite={drinkIsFavorite}
                drinkMeta={drinkMeta}
                match={match}
                onOpen={() => onOpenDrink(drink.slug)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
