import { useMemo, useState } from 'react';
import {
  DRINK_CATEGORY_CHIPS,
  DRINK_COLLECTIONS,
  DRINK_FLAVOR_CHIPS,
  encodeBarShare,
  getCollectionById,
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

type ActiveTag = {
  id: string;
  label: string;
  onRemove: () => void;
};

function buildActiveTags(
  filters: DiscoverFilters,
  onFiltersChange: (patch: Partial<DiscoverFilters>) => void,
): ActiveTag[] {
  const tags: ActiveTag[] = [];

  if (filters.collection) {
    const collection = getCollectionById(filters.collection);
    tags.push({
      id: 'collection',
      label: collection ? `${collection.emoji} ${collection.label}` : 'Coleção',
      onRemove: () => onFiltersChange({ collection: null }),
    });
  }

  if (filters.flavor) {
    const flavor = DRINK_FLAVOR_CHIPS.find((chip) => chip.id === filters.flavor);
    tags.push({
      id: 'flavor',
      label: flavor?.label ?? 'Sabor',
      onRemove: () => onFiltersChange({ flavor: null }),
    });
  }

  const spirit = filters.baseSpirit ?? filters.category;
  if (spirit) {
    const chip = DRINK_CATEGORY_CHIPS.find((entry) => entry.id === spirit);
    tags.push({
      id: 'spirit',
      label: chip?.label ?? 'Tipo',
      onRemove: () => onFiltersChange({ baseSpirit: null, category: null }),
    });
  }

  if (filters.favoritesOnly) {
    tags.push({
      id: 'favorites',
      label: '★ Favoritos',
      onRemove: () => onFiltersChange({ favoritesOnly: false }),
    });
  }

  if (filters.triedOnly) {
    tags.push({
      id: 'tried',
      label: '✓ Já provei',
      onRemove: () => onFiltersChange({ triedOnly: false }),
    });
  }

  if (filters.wantToTryOnly) {
    tags.push({
      id: 'want',
      label: 'Quero experimentar',
      onRemove: () => onFiltersChange({ wantToTryOnly: false }),
    });
  }

  return tags;
}

function countExtraFilters(filters: DiscoverFilters): number {
  let count = 0;
  if (filters.collection) count += 1;
  if (filters.flavor) count += 1;
  if (filters.baseSpirit || filters.category) count += 1;
  if (filters.favoritesOnly) count += 1;
  if (filters.triedOnly) count += 1;
  if (filters.wantToTryOnly) count += 1;
  return count;
}

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
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

  const activeTags = useMemo(
    () => buildActiveTags(filters, onFiltersChange),
    [filters, onFiltersChange],
  );

  const extraFilterCount = countExtraFilters(filters);

  const clearExtraFilters = () => {
    onFiltersChange({
      collection: null,
      flavor: null,
      baseSpirit: null,
      category: null,
      favoritesOnly: false,
      triedOnly: false,
      wantToTryOnly: false,
    });
  };

  const setSpirit = (id: DrinkCategoryId | null) => {
    onFiltersChange({ baseSpirit: id, category: id });
  };

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
    setToolsOpen(false);
  };

  return (
    <>
      <div className={styles.discoverBar}>
        <div className={styles.discoverTopRow}>
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
          <button
            type="button"
            className={`${styles.discoverIconBtn} ${extraFilterCount > 0 ? styles.discoverIconBtnActive : ''}`}
            onClick={() => setFiltersOpen(true)}
            aria-label="Abrir filtros"
          >
            Filtros
            {extraFilterCount > 0 ? (
              <span className={styles.discoverBadge}>{extraFilterCount}</span>
            ) : null}
          </button>
          {hasAdegaStock ? (
            <button
              type="button"
              className={styles.discoverIconBtn}
              onClick={() => setToolsOpen(true)}
              aria-label="Ferramentas do bar"
            >
              ⋯
            </button>
          ) : null}
        </div>

        {hasAdegaStock ? (
          <div className={styles.discoverPrimaryScroll} role="group" aria-label="Disponível na adega">
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.adegaMode === 'all' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ adegaMode: 'all' })}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.adegaMode === 'ready' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ adegaMode: 'ready' })}
            >
              Posso fazer · {readyCount}
            </button>
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.adegaMode === 'almost' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ adegaMode: 'almost' })}
            >
              Quase · {almostCount}
            </button>
          </div>
        ) : null}

        {activeTags.length > 0 ? (
          <div className={styles.discoverActiveTags}>
            {activeTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={styles.discoverActiveTag}
                onClick={tag.onRemove}
                aria-label={`Remover filtro ${tag.label}`}
              >
                {tag.label}
                <span aria-hidden> ×</span>
              </button>
            ))}
            <button type="button" className={styles.discoverClearTags} onClick={clearExtraFilters}>
              Limpar
            </button>
          </div>
        ) : null}
      </div>

      {filtersOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setFiltersOpen(false)}>
          <div
            className={styles.modalSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-filters-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 id="discover-filters-title" className={styles.modalTitle}>
                Filtros
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setFiltersOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <section className={styles.filterSection}>
                <p className={styles.filterSectionTitle}>Coleção</p>
                <div className={styles.filterChipGrid}>
                  {DRINK_COLLECTIONS.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      className={`${styles.filterChip} ${filters.collection === collection.id ? styles.filterChipActive : ''}`}
                      onClick={() =>
                        onFiltersChange({
                          collection:
                            filters.collection === collection.id ? null : collection.id,
                        })
                      }
                    >
                      {collection.emoji} {collection.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.filterSection}>
                <p className={styles.filterSectionTitle}>Sabor</p>
                <div className={styles.filterChipGrid}>
                  {DRINK_FLAVOR_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.filterChip} ${filters.flavor === chip.id ? styles.filterChipActive : ''}`}
                      onClick={() =>
                        onFiltersChange({
                          flavor: filters.flavor === chip.id ? null : chip.id,
                        })
                      }
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.filterSection}>
                <p className={styles.filterSectionTitle}>Base / tipo</p>
                <div className={styles.filterChipGrid}>
                  {DRINK_CATEGORY_CHIPS.map((chip) => {
                    const active = (filters.baseSpirit ?? filters.category) === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                        onClick={() => setSpirit(active ? null : chip.id)}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {(favoriteCount > 0 || triedCount > 0 || wantToTryCount > 0) ? (
                <section className={styles.filterSection}>
                  <p className={styles.filterSectionTitle}>Minha lista</p>
                  <div className={styles.filterChipGrid}>
                    {favoriteCount > 0 ? (
                      <button
                        type="button"
                        className={`${styles.filterChip} ${filters.favoritesOnly ? styles.filterChipActive : ''}`}
                        onClick={() => onFiltersChange({ favoritesOnly: !filters.favoritesOnly })}
                      >
                        ★ Favoritos ({favoriteCount})
                      </button>
                    ) : null}
                    {triedCount > 0 ? (
                      <button
                        type="button"
                        className={`${styles.filterChip} ${filters.triedOnly ? styles.filterChipActive : ''}`}
                        onClick={() => onFiltersChange({ triedOnly: !filters.triedOnly })}
                      >
                        ✓ Já provei ({triedCount})
                      </button>
                    ) : null}
                    {wantToTryCount > 0 ? (
                      <button
                        type="button"
                        className={`${styles.filterChip} ${filters.wantToTryOnly ? styles.filterChipActive : ''}`}
                        onClick={() => onFiltersChange({ wantToTryOnly: !filters.wantToTryOnly })}
                      >
                        Quero experimentar ({wantToTryCount})
                      </button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <div className={styles.filterSheetFoot}>
                <button type="button" className={styles.filterClearBtn} onClick={clearExtraFilters}>
                  Limpar filtros
                </button>
                <button
                  type="button"
                  className={styles.filterApplyBtn}
                  onClick={() => setFiltersOpen(false)}
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toolsOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setToolsOpen(false)}>
          <div
            className={styles.modalSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discover-tools-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 id="discover-tools-title" className={styles.modalTitle}>
                Ferramentas
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setToolsOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.modalBody}>
              <ul className={styles.toolsList}>
                {shoppingList.length > 0 ? (
                  <li>
                    <button
                      type="button"
                      className={styles.toolsItem}
                      onClick={() => {
                        setToolsOpen(false);
                        setShoppingOpen(true);
                      }}
                    >
                      <span className={styles.toolsItemLabel}>Lista de compras</span>
                      <span className={styles.toolsItemMeta}>{shoppingList.length} itens</span>
                    </button>
                  </li>
                ) : null}
                <li>
                  <button
                    type="button"
                    className={styles.toolsItem}
                    onClick={() => {
                      setToolsOpen(false);
                      setPartyOpen(true);
                    }}
                  >
                    <span className={styles.toolsItemLabel}>Modo festa</span>
                    <span className={styles.toolsItemMeta}>Sugestões para convidados</span>
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.toolsItem} onClick={() => void handleShare()}>
                    <span className={styles.toolsItemLabel}>
                      {shareCopied ? 'Link copiado!' : 'Compartilhar bar'}
                    </span>
                    <span className={styles.toolsItemMeta}>Link só leitura</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

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
