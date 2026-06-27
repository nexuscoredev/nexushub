import { useMemo, useState } from 'react';
import {
  COFFEE_METHOD_CHIPS,
  COFFEE_SYSTEM_CHIPS,
  type CoffeeDiscoverFilters,
} from '../../lib/coffeeCartaDiscover';
import type { CoffeeCapsuleSystem } from '../../lib/viniciusCoffeeStock';
import styles from './ViniciusDrinksCarta.module.css';

type CoffeeCartaDiscoverBarProps = {
  showStockFilters: boolean;
  readyCount: number;
  almostCount: number;
  filters: CoffeeDiscoverFilters;
  onFiltersChange: (patch: Partial<CoffeeDiscoverFilters>) => void;
};

function countExtraFilters(filters: CoffeeDiscoverFilters): number {
  let count = 0;
  if (filters.method) count += 1;
  if (filters.capsuleSystem) count += 1;
  return count;
}

export function CoffeeCartaDiscoverBar({
  showStockFilters,
  readyCount,
  almostCount,
  filters,
  onFiltersChange,
}: CoffeeCartaDiscoverBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const extraFilterCount = countExtraFilters(filters);

  const activeTags = useMemo(() => {
    const tags: { id: string; label: string; onRemove: () => void }[] = [];
    if (filters.method) {
      const chip = COFFEE_METHOD_CHIPS.find((entry) => entry.id === filters.method);
      tags.push({
        id: 'method',
        label: chip?.label ?? 'Método',
        onRemove: () => onFiltersChange({ method: null }),
      });
    }
    if (filters.capsuleSystem) {
      const chip = COFFEE_SYSTEM_CHIPS.find((entry) => entry.id === filters.capsuleSystem);
      tags.push({
        id: 'system',
        label: chip?.label ?? 'Sistema',
        onRemove: () => onFiltersChange({ capsuleSystem: null }),
      });
    }
    return tags;
  }, [filters, onFiltersChange]);

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
              placeholder="Buscar receita, ingrediente ou preparo…"
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              aria-label="Buscar na carta de café"
              enterKeyHint="search"
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
        </div>

        {showStockFilters ? (
          <div className={styles.discoverPrimaryScroll} role="group" aria-label="Disponível no estoque">
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.stockMode === 'all' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ stockMode: 'all' })}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.stockMode === 'ready' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ stockMode: 'ready' })}
            >
              Posso fazer · {readyCount}
            </button>
            <button
              type="button"
              className={`${styles.discoverPrimaryChip} ${filters.stockMode === 'almost' ? styles.discoverPrimaryChipActive : ''}`}
              onClick={() => onFiltersChange({ stockMode: 'almost' })}
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
            <button
              type="button"
              className={styles.discoverClearTags}
              onClick={() => onFiltersChange({ method: null, capsuleSystem: null })}
            >
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
            aria-labelledby="coffee-filters-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHead}>
              <h3 id="coffee-filters-title" className={styles.modalTitle}>
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
                <p className={styles.filterSectionTitle}>Método de preparo</p>
                <div className={styles.filterChipGrid}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filters.method == null ? styles.filterChipActive : ''}`}
                    onClick={() => onFiltersChange({ method: null })}
                  >
                    Todos
                  </button>
                  {COFFEE_METHOD_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.filterChip} ${filters.method === chip.id ? styles.filterChipActive : ''}`}
                      onClick={() =>
                        onFiltersChange({
                          method: filters.method === chip.id ? null : chip.id,
                        })
                      }
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className={styles.filterSection}>
                <p className={styles.filterSectionTitle}>Sistema de cápsula</p>
                <div className={styles.filterChipGrid}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${filters.capsuleSystem == null ? styles.filterChipActive : ''}`}
                    onClick={() => onFiltersChange({ capsuleSystem: null })}
                  >
                    Todos
                  </button>
                  {COFFEE_SYSTEM_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className={`${styles.filterChip} ${filters.capsuleSystem === chip.id ? styles.filterChipActive : ''}`}
                      onClick={() =>
                        onFiltersChange({
                          capsuleSystem:
                            filters.capsuleSystem === chip.id ? null : (chip.id as CoffeeCapsuleSystem),
                        })
                      }
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className={styles.filterSheetFoot}>
                <button
                  type="button"
                  className={styles.filterClearBtn}
                  onClick={() => onFiltersChange({ method: null, capsuleSystem: null })}
                >
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
    </>
  );
}
