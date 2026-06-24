import { useMemo, useState } from 'react';
import {
  DRINK_CATEGORY_CHIPS,
  DRINK_COLLECTIONS,
  DRINK_FLAVOR_CHIPS,
  encodeBarShare,
  rankPartyModeDrinks,
  type DrinkCategoryId,
  type DrinkCollectionId,
  type DrinkFlavorId,
} from '../../lib/drinkCartaDiscover';
import { aggregateShoppingList, formatMissingIngredients } from '../../lib/drinkAdegaMatch';
import type { ViniciusDrink } from '../../lib/viniciusDrinksCarta';
import type { AdegaItem } from '../../lib/viniciusAdega';
import styles from './ViniciusDrinksCarta.module.css';

export type DiscoverFilters = {
  search: string;
  category: DrinkCategoryId | null;
  baseSpirit: DrinkCategoryId | null;
  flavor: DrinkFlavorId | null;
  collection: DrinkCollectionId | null;
  adegaMode: 'all' | 'ready' | 'almost';
  favoritesOnly: boolean;
  triedOnly: boolean;
  wantToTryOnly: boolean;
};

type DrinkCartaDiscoverBarProps = {
  drinks: ViniciusDrink[];
  adegaItems: AdegaItem[];
  hasAdegaStock: boolean;
  readyCount: number;
  almostCount: number;
  favoriteCount: number;
  triedCount: number;
  wantToTryCount: number;
  filters: DiscoverFilters;
  onFiltersChange: (patch: Partial<DiscoverFilters>) => void;
  onOpenDrink: (slug: string) => void;
};

export function DrinkCartaDiscoverBar({
  drinks,
  adegaItems,
  hasAdegaStock,
  readyCount,
  almostCount,
  favoriteCount,
  triedCount,
  wantToTryCount,
  filters,
  onFiltersChange,
  onOpenDrink,
}: DrinkCartaDiscoverBarProps) {
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(4);
  const [shareCopied, setShareCopied] = useState(false);

  const shoppingList = useMemo(
    () => (hasAdegaStock ? aggregateShoppingList(drinks, adegaItems) : []),
    [drinks, adegaItems, hasAdegaStock],
  );

  const partySuggestions = useMemo(
    () => (hasAdegaStock ? rankPartyModeDrinks(drinks, adegaItems, guestCount) : []),
    [drinks, adegaItems, guestCount, hasAdegaStock],
  );

  const handleShare = async () => {
    const encoded = encodeBarShare(drinks, adegaItems);
    const url = new URL(window.location.href);
    url.searchParams.set('barShare', encoded);
    url.searchParams.set('drinks', '1');
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('Copie o link do bar:', url.toString());
    }
  };

  return (
    <>
      <div className={styles.discoverBar}>
        <label className={styles.discoverSearchWrap}>
          <span className={styles.discoverSearchIcon} aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className={styles.discoverSearch}
            placeholder="Buscar drink ou ingrediente…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            aria-label="Buscar na carta"
          />
        </label>

        <div className={styles.discoverChips} role="group" aria-label="Coleções">
          <button
            type="button"
            className={`${styles.discoverChip} ${filters.collection == null ? styles.discoverChipActive : ''}`}
            onClick={() => onFiltersChange({ collection: null })}
          >
            Todas
          </button>
          {DRINK_COLLECTIONS.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={`${styles.discoverChip} ${filters.collection === collection.id ? styles.discoverChipActive : ''}`}
              onClick={() =>
                onFiltersChange({
                  collection: filters.collection === collection.id ? null : collection.id,
                })
              }
              title={collection.description}
            >
              {collection.emoji} {collection.label}
            </button>
          ))}
        </div>

        <div className={styles.discoverChips} role="group" aria-label="Perfil de sabor">
          <button
            type="button"
            className={`${styles.discoverChip} ${filters.flavor == null ? styles.discoverChipActive : ''}`}
            onClick={() => onFiltersChange({ flavor: null })}
          >
            Qualquer sabor
          </button>
          {DRINK_FLAVOR_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`${styles.discoverChip} ${filters.flavor === chip.id ? styles.discoverChipActive : ''}`}
              onClick={() =>
                onFiltersChange({ flavor: filters.flavor === chip.id ? null : chip.id })
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.discoverChips} role="group" aria-label="Base drink">
          <button
            type="button"
            className={`${styles.discoverChip} ${filters.baseSpirit == null ? styles.discoverChipActive : ''}`}
            onClick={() => onFiltersChange({ baseSpirit: null })}
          >
            Qualquer base
          </button>
          {DRINK_CATEGORY_CHIPS.filter((chip) => chip.id !== 'classico' && chip.id !== 'sem-alcool').map(
            (chip) => (
              <button
                key={`base-${chip.id}`}
                type="button"
                className={`${styles.discoverChip} ${filters.baseSpirit === chip.id ? styles.discoverChipActive : ''}`}
                onClick={() =>
                  onFiltersChange({
                    baseSpirit: filters.baseSpirit === chip.id ? null : chip.id,
                  })
                }
              >
                {chip.label}
              </button>
            ),
          )}
        </div>

        <div className={styles.discoverChips} role="group" aria-label="Categorias">
          <button
            type="button"
            className={`${styles.discoverChip} ${filters.category == null ? styles.discoverChipActive : ''}`}
            onClick={() => onFiltersChange({ category: null })}
          >
            Todas
          </button>
          {DRINK_CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`${styles.discoverChip} ${filters.category === chip.id ? styles.discoverChipActive : ''}`}
              onClick={() =>
                onFiltersChange({ category: filters.category === chip.id ? null : chip.id })
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.discoverActions}>
          {triedCount > 0 ? (
            <button
              type="button"
              className={`${styles.discoverActionBtn} ${filters.triedOnly ? styles.discoverActionBtnActive : ''}`}
              onClick={() => onFiltersChange({ triedOnly: !filters.triedOnly })}
            >
              ✓ Já provei ({triedCount})
            </button>
          ) : null}

          {wantToTryCount > 0 ? (
            <button
              type="button"
              className={`${styles.discoverActionBtn} ${filters.wantToTryOnly ? styles.discoverActionBtnActive : ''}`}
              onClick={() => onFiltersChange({ wantToTryOnly: !filters.wantToTryOnly })}
            >
              Quero experimentar ({wantToTryCount})
            </button>
          ) : null}

          {favoriteCount > 0 ? (
            <button
              type="button"
              className={`${styles.discoverActionBtn} ${filters.favoritesOnly ? styles.discoverActionBtnActive : ''}`}
              onClick={() => onFiltersChange({ favoritesOnly: !filters.favoritesOnly })}
            >
              ★ Favoritos ({favoriteCount})
            </button>
          ) : null}

          {hasAdegaStock ? (
            <div className={styles.adegaFilterBar} role="group" aria-label="Filtrar por adega">
              <button
                type="button"
                className={`${styles.adegaFilterBtn} ${filters.adegaMode === 'all' ? styles.adegaFilterBtnActive : ''}`}
                onClick={() => onFiltersChange({ adegaMode: 'all' })}
              >
                Todas
              </button>
              <button
                type="button"
                className={`${styles.adegaFilterBtn} ${filters.adegaMode === 'ready' ? styles.adegaFilterBtnActive : ''}`}
                onClick={() => onFiltersChange({ adegaMode: 'ready' })}
              >
                Posso fazer ({readyCount})
              </button>
              <button
                type="button"
                className={`${styles.adegaFilterBtn} ${filters.adegaMode === 'almost' ? styles.adegaFilterBtnActive : ''}`}
                onClick={() => onFiltersChange({ adegaMode: 'almost' })}
              >
                Quase posso ({almostCount})
              </button>
            </div>
          ) : null}

          {hasAdegaStock && shoppingList.length > 0 ? (
            <button
              type="button"
              className={styles.discoverActionBtn}
              onClick={() => setShoppingOpen(true)}
            >
              Lista de compras ({shoppingList.length})
            </button>
          ) : null}

          {hasAdegaStock ? (
            <button type="button" className={styles.discoverActionBtn} onClick={() => setPartyOpen(true)}>
              Modo festa
            </button>
          ) : null}

          {hasAdegaStock ? (
            <button type="button" className={styles.discoverActionBtn} onClick={() => void handleShare()}>
              {shareCopied ? 'Link copiado!' : 'Compartilhar bar'}
            </button>
          ) : null}
        </div>
      </div>

      {shoppingOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setShoppingOpen(false)}>
          <div
            className={styles.modalSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-list-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 id="shopping-list-title" className={styles.modalTitle}>
                Lista de compras
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShoppingOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <p className={styles.modalLead}>
                Ingredientes que faltam para drinks &quot;quase posso fazer&quot;.
              </p>
              <ul className={styles.shoppingList}>
                {shoppingList.map((entry) => (
                  <li key={entry.label} className={styles.shoppingItem}>
                    <span className={styles.shoppingLabel}>{entry.label}</span>
                    <span className={styles.shoppingMeta}>
                      {entry.count} {entry.count === 1 ? 'drink' : 'drinks'} · {entry.drinks.join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {partyOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setPartyOpen(false)}>
          <div
            className={styles.modalSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="party-mode-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 id="party-mode-title" className={styles.modalTitle}>
                Modo festa
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setPartyOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <p className={styles.modalLead}>
                Sugestões para aproveitar sua adega com convidados.
              </p>
              <label className={styles.partyGuests}>
                <span>Convidados</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              {partySuggestions.length === 0 ? (
                <p className={styles.modalEmpty}>Cadastre mais itens na adega para ver sugestões.</p>
              ) : (
                <ul className={styles.partyList}>
                  {partySuggestions.map(({ drink, match, servings }) => (
                    <li key={drink.slug}>
                      <button
                        type="button"
                        className={styles.partyItem}
                        onClick={() => {
                          setPartyOpen(false);
                          onOpenDrink(drink.slug);
                        }}
                      >
                        <span className={styles.partyItemTitle}>{drink.title}</span>
                        <span className={styles.partyItemMeta}>
                          ~{servings} porções
                          {match.status === 'partial' && match.missingLabels.length > 0
                            ? ` · Falta: ${formatMissingIngredients(match)}`
                            : ' · Adega completa'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
