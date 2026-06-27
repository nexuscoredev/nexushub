import {
  coffeeMethodLabel,
  coffeeStockStatusLabel,
  isCapsuleCartaRecipe,
} from '../../lib/coffeeCartaDiscover';
import type { CoffeeStockMatch } from '../../lib/coffeeStockMatch';
import type { CoffeeCartaViewMode } from '../../lib/coffeeCartaView';
import type { ViniciusCoffeeRecipe } from '../../lib/viniciusCoffeeCarta';
import { DrinkThumb } from './DrinkThumb';
import styles from './ViniciusDrinksCarta.module.css';

type CoffeeCartaListProps = {
  recipes: ViniciusCoffeeRecipe[];
  viewMode: CoffeeCartaViewMode;
  editing: boolean;
  stockMatches: Map<string, CoffeeStockMatch>;
  onOpenRecipe: (slug: string) => void;
  onEditRecipe: (slug: string) => void;
};

function CoffeeBadges({
  recipe,
  match,
}: {
  recipe: ViniciusCoffeeRecipe;
  match: CoffeeStockMatch | undefined;
}) {
  if (isCapsuleCartaRecipe(recipe)) {
    return (
      <>
        <span className={styles.cardAdegaBadge}>Cápsula</span>
        {match?.matches.length ? (
          <span className={styles.cardTriedBadge} title={match.matches.map((m) => m.itemName).join(', ')}>
            Estoque
          </span>
        ) : null}
      </>
    );
  }

  return (
    <>
      {match?.status === 'ready' ? <span className={styles.cardAdegaBadge}>Estoque</span> : null}
      {match?.status === 'partial' ? (
        <span className={styles.cardAdegaBadgePartial} title={`Falta: ${match.missingLabels.join(', ')}`}>
          Falta
        </span>
      ) : null}
    </>
  );
}

function EditingCard({
  recipe,
  onEdit,
  onOpen,
}: {
  recipe: ViniciusCoffeeRecipe;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={`${styles.card} ${styles.cardEditing}`}>
      <button type="button" className={styles.cardEditMedia} onClick={onEdit} aria-label={`Editar ${recipe.title}`}>
        <span className={styles.cardMedia}>
          <DrinkThumb src={recipe.imageUrl} alt="" className={styles.cardMediaImg} />
        </span>
        <span className={styles.cardEditBadge}>✎</span>
      </button>
      <button type="button" className={styles.cardEditBody} onClick={onEdit}>
        <span className={styles.cardTitle}>{recipe.title}</span>
        <span className={styles.cardTagline}>{recipe.tagline}</span>
      </button>
      <button type="button" className={styles.cardPreviewBtn} onClick={onOpen} aria-label={`Ver ${recipe.title}`}>
        →
      </button>
    </div>
  );
}

function CoffeeCard({
  recipe,
  viewMode,
  match,
  onOpen,
}: {
  recipe: ViniciusCoffeeRecipe;
  viewMode: CoffeeCartaViewMode;
  match: CoffeeStockMatch | undefined;
  onOpen: () => void;
}) {
  const previewIngredient = recipe.ingredients[0]?.replace(/;\s*$/, '') ?? '';
  const showTagline = viewMode === 'content' || viewMode === 'tiles' || viewMode.startsWith('icons-');
  const showPreview = viewMode === 'content';

  return (
    <button
      type="button"
      className={`${styles.card} ${styles[`cardView_${viewMode}`]}`}
      onClick={onOpen}
    >
      <span className={styles.cardMedia}>
        <DrinkThumb src={recipe.imageUrl} alt="" className={styles.cardMediaImg} />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitleRow}>
          <span className={styles.cardTitle}>{recipe.title}</span>
          <CoffeeBadges recipe={recipe} match={match} />
        </span>
        {showTagline ? <span className={styles.cardTagline}>{recipe.tagline}</span> : null}
        {showPreview && previewIngredient ? (
          <span className={styles.cardContentPreview}>{previewIngredient}</span>
        ) : null}
        {viewMode === 'content' && match && match.missingLabels.length > 0 && !isCapsuleCartaRecipe(recipe) ? (
          <span className={styles.cardAdegaMissing}>Falta: {match.missingLabels.join(', ')}</span>
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

export function CoffeeCartaList({
  recipes,
  viewMode,
  editing,
  stockMatches,
  onOpenRecipe,
  onEditRecipe,
}: CoffeeCartaListProps) {
  if (viewMode === 'details' && !editing) {
    return (
      <div className={styles.detailsTable} role="table" aria-label="Carta de café">
        <div className={styles.detailsHead} role="row">
          <span role="columnheader">Receita</span>
          <span role="columnheader" className={styles.detailsColType}>
            Método
          </span>
          <span role="columnheader" className={styles.detailsColAdega}>
            Estoque
          </span>
        </div>
        <ul className={`${styles.list} ${styles.listView_details}`}>
          {recipes.map((recipe) => {
            const match = stockMatches.get(recipe.slug);
            return (
              <li key={recipe.slug} role="row">
                <button type="button" className={styles.detailsRow} onClick={() => onOpenRecipe(recipe.slug)}>
                  <span className={styles.detailsDrinkCell} role="cell">
                    <span className={styles.detailsThumb}>
                      <DrinkThumb src={recipe.imageUrl} alt="" className={styles.cardMediaImg} />
                    </span>
                    <span className={styles.detailsDrinkText}>
                      <span className={styles.cardTitle}>{recipe.title}</span>
                    </span>
                  </span>
                  <span className={styles.detailsColType} role="cell">
                    {coffeeMethodLabel(recipe.method)}
                  </span>
                  <span className={styles.detailsColAdega} role="cell">
                    {coffeeStockStatusLabel(recipe, match)}
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
      {recipes.map((recipe) => {
        const match = stockMatches.get(recipe.slug);
        return (
          <li key={recipe.slug}>
            {editing ? (
              <EditingCard
                recipe={recipe}
                onEdit={() => onEditRecipe(recipe.slug)}
                onOpen={() => onOpenRecipe(recipe.slug)}
              />
            ) : (
              <CoffeeCard
                recipe={recipe}
                viewMode={viewMode}
                match={match}
                onOpen={() => onOpenRecipe(recipe.slug)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
