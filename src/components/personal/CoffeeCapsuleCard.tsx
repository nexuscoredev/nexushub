import {
  capsuleSystemIcon,
  categoryEmoji,
  type CoffeeCapsuleSystem,
  type CoffeeStockItem,
} from '../../lib/viniciusCoffeeStock';
import { intensityLabel } from '../../lib/coffeeCapsuleMeta';
import styles from './ViniciusCoffee.module.css';

function capsuleSubtitle(item: CoffeeStockItem): string {
  return (
    intensityLabel(item.intensity) ??
    item.flavorNotes ??
    item.brand ??
    item.category.replace(/^Cápsula\s+/i, '')
  );
}

function systemClass(system?: CoffeeCapsuleSystem): string {
  if (system === 'dolce-gusto') return styles.capsuleArtDolce;
  if (system === 'nespresso') return styles.capsuleArtNespresso;
  if (system === 'tres-coracoes') return styles.capsuleArtTres;
  return styles.capsuleArtDefault;
}

type CoffeeCapsuleCardProps = {
  item: CoffeeStockItem;
  layout?: 'carousel' | 'grid';
  editing?: boolean;
  onOpen: (item: CoffeeStockItem) => void;
  onToggleFavorite?: (id: string) => void;
};

export function CoffeeCapsuleCard({
  item,
  layout = 'grid',
  editing = false,
  onOpen,
  onToggleFavorite,
}: CoffeeCapsuleCardProps) {
  const outOfStock = item.quantity <= 0;
  const systemIcon = capsuleSystemIcon(item.capsuleSystem);

  return (
    <article
      className={`${styles.capsuleCard} ${styles[`capsuleCard_${layout}`]} ${outOfStock ? styles.capsuleCardOut : ''}`}
    >
      {onToggleFavorite && !editing ? (
        <button
          type="button"
          className={`${styles.capsuleFavorite} ${item.favorite ? styles.capsuleFavoriteOn : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          aria-label={item.favorite ? 'Remover dos favoritos' : 'Favoritar'}
        >
          ♥
        </button>
      ) : null}
      <button
        type="button"
        className={styles.capsuleCardTap}
        onClick={() => onOpen(item)}
        aria-label={`Ver ${item.name}`}
      >
        <span className={`${styles.capsuleArt} ${systemClass(item.capsuleSystem)}`}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className={styles.capsulePhoto} loading="lazy" decoding="async" />
          ) : systemIcon ? (
            <img src={systemIcon} alt="" className={styles.capsuleSystemImg} />
          ) : (
            <span className={styles.capsuleEmoji}>{item.iconEmoji ?? categoryEmoji(item.category)}</span>
          )}
        </span>
        <span className={styles.capsuleName}>{item.name}</span>
        <span className={styles.capsuleMeta}>{capsuleSubtitle(item)}</span>
        {!outOfStock ? (
          <span className={styles.capsuleQty}>{item.quantity} un.</span>
        ) : (
          <span className={styles.capsuleQtyOut}>Acabou</span>
        )}
      </button>
    </article>
  );
}
