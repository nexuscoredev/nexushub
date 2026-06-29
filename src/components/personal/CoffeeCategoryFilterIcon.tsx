import type { CoffeeCapsuleSystem } from '../../lib/viniciusCoffeeStock';
import { COFFEE_CAPSULE_SYSTEMS } from '../../lib/viniciusCoffeeStock';
import adegaStyles from './ViniciusAdega.module.css';
import styles from './ViniciusCoffee.module.css';

export type CoffeeCategoryFilterId =
  | 'collection'
  | 'favorites'
  | CoffeeCapsuleSystem;

const SYSTEM_ICON_BY_ID = Object.fromEntries(
  COFFEE_CAPSULE_SYSTEMS.map((system) => [system.id, system.icon]),
) as Record<CoffeeCapsuleSystem, string>;

const LABELS: Record<CoffeeCategoryFilterId, string> = {
  collection: 'Coleção',
  favorites: 'Favoritos',
  'dolce-gusto': 'Dolce Gusto',
  'tres-coracoes': 'Três Corações',
  nespresso: 'Nespresso',
};

type CoffeeCategoryFilterIconProps = {
  id: CoffeeCategoryFilterId;
  active?: boolean;
};

export function coffeeCategoryFilterLabel(id: CoffeeCategoryFilterId): string {
  return LABELS[id];
}

export function CoffeeCategoryFilterIcon({ id, active = false }: CoffeeCategoryFilterIconProps) {
  if (id === 'collection') {
    return (
      <span
        className={`material-symbols-outlined ${adegaStyles.filterBtnMaterialIcon}`}
        aria-hidden
      >
        apps
      </span>
    );
  }

  if (id === 'favorites') {
    return (
      <span
        className={`material-symbols-outlined ${adegaStyles.filterBtnMaterialIcon} ${active ? styles.filterStarActive : ''}`}
        aria-hidden
      >
        star
      </span>
    );
  }

  return (
    <img
      src={SYSTEM_ICON_BY_ID[id]}
      alt=""
      className={adegaStyles.filterBtnBrandIcon}
      width={26}
      height={26}
      loading="lazy"
      decoding="async"
    />
  );
}
