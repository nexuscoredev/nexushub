import { useMemo, useState } from 'react';
import {
  catalogEntryPrimaryImage,
  COFFEE_CAPSULE_CATALOG_BY_SYSTEM,
  COFFEE_CAPSULE_CATALOG_COUNT,
  searchCoffeeCapsuleCatalog,
  type CoffeeCapsuleCatalogEntry,
} from '../../lib/coffeeCapsuleCatalog';
import { COFFEE_CAPSULE_SYSTEMS, type CoffeeCapsuleSystem } from '../../lib/viniciusCoffeeStock';
import { intensityLabel } from '../../lib/coffeeCapsuleMeta';
import styles from './ViniciusCoffee.module.css';

type CoffeeCapsuleCatalogPickerProps = {
  initialSystem?: CoffeeCapsuleSystem | null;
  onPick: (entry: CoffeeCapsuleCatalogEntry) => void;
  onCustom: () => void;
  onClose: () => void;
};

export function CoffeeCapsuleCatalogPicker({
  initialSystem = null,
  onPick,
  onCustom,
  onClose,
}: CoffeeCapsuleCatalogPickerProps) {
  const [search, setSearch] = useState('');
  const [system, setSystem] = useState<CoffeeCapsuleSystem | null>(initialSystem);

  const results = useMemo(
    () => searchCoffeeCapsuleCatalog(search, system),
    [search, system],
  );

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.catalogPicker}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-picker-title"
      >
        <header className={styles.catalogPickerHead}>
          <div>
            <h2 id="catalog-picker-title" className={styles.catalogPickerTitle}>
              Escolher do catálogo
            </h2>
            <p className={styles.catalogPickerSubtitle}>
              {COFFEE_CAPSULE_CATALOG_COUNT} variedades · metadados oficiais
            </p>
          </div>
          <button type="button" className={styles.headerBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <label className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Buscar Arpeggio, Colombia, Forza…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </label>

        <div className={styles.catalogSystemTabs} role="tablist">
          <button
            type="button"
            role="tab"
            className={`${styles.catalogSystemTab} ${!system ? styles.catalogSystemTabActive : ''}`}
            onClick={() => setSystem(null)}
          >
            Todas ({COFFEE_CAPSULE_CATALOG_COUNT})
          </button>
          {COFFEE_CAPSULE_SYSTEMS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={system === entry.id}
              className={`${styles.catalogSystemTab} ${system === entry.id ? styles.catalogSystemTabActive : ''}`}
              onClick={() => setSystem(entry.id)}
            >
              <img src={entry.icon} alt="" />
              {entry.label.split(' ')[0]} ({COFFEE_CAPSULE_CATALOG_BY_SYSTEM[entry.id]})
            </button>
          ))}
        </div>

        <ul className={styles.catalogResults}>
          {results.map((entry) => {
            const thumb = catalogEntryPrimaryImage(entry);
            const intensity = intensityLabel(entry.intensity);
            return (
              <li key={entry.slug}>
                <button type="button" className={styles.catalogResultRow} onClick={() => onPick(entry)}>
                  <span className={styles.catalogResultThumb}>
                    {thumb ? (
                      <img src={thumb} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className={styles.catalogResultPlaceholder}>☕</span>
                    )}
                    {entry.imagesPending ? (
                      <span className={styles.catalogPendingBadge} title="Fotos pendentes">
                        ◌
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.catalogResultBody}>
                    <span className={styles.catalogResultBrand}>{entry.brand}</span>
                    <span className={styles.catalogResultName}>{entry.name}</span>
                    <span className={styles.catalogResultMeta}>
                      {[intensity, entry.flavorNotes, entry.packSize ? `×${entry.packSize}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className={styles.catalogResultArrow} aria-hidden>
                    →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {results.length === 0 ? (
          <p className={styles.catalogEmpty}>Nenhuma variedade encontrada.</p>
        ) : null}

        <footer className={styles.catalogPickerFoot}>
          <button type="button" className={styles.cancelBtn} onClick={onCustom}>
            Cadastrar manualmente
          </button>
        </footer>
      </div>
    </div>
  );
}
